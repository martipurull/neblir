import { errorResponse } from "@/app/api/shared/responses";
import {
  isBotAttributeRoll,
  prepareBotAttributeRoll,
} from "@/app/lib/botAttributeRoll";
import { isBotCombatValue } from "@/app/lib/botCombat";
import { prepareBotCombatRoll } from "@/app/lib/botCombatRoll";
import { prepareBotActionRoll, readBotActionList } from "@/app/lib/botActions";
import { prepareBotInitiativeRoll } from "@/app/lib/botInitiative";
import {
  botHoldingSource,
  missingBotTemplateMessage,
  presentBotHolding,
} from "@/app/lib/botHoldingView";
import {
  getBotCharacterRow,
  resolveHoldingTemplate,
  setBotReactionsRemaining,
} from "@/app/lib/prisma/botCharacter";
import { installedItemBotActions } from "@/app/lib/prisma/botPlacement";
import {
  loadBotHandWeapon,
  spendBotWeaponUse,
} from "@/app/lib/prisma/botHandWeapon";
import {
  characterIsInGame,
  getGameCharacterLinkIsPublic,
  userHasPlayControlInGame,
} from "@/app/lib/prisma/gameCharacter";
import { getEnemyInstanceIsPublic } from "@/app/lib/prisma/enemyInstance";
import {
  enemyInstanceIdFromRollMetadata,
  resolvePersistedRollIsPrivate,
  rollMetadataWithPrivateFlag,
} from "@/app/lib/roll-privacy";
import { prisma } from "@/app/lib/prisma/client";
import type { Prisma } from "@prisma/client";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { rollEventPayloadSchema } from "@/app/lib/types/roll-event";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { serializeError } from "../../../shared/errors";
import { NextResponse } from "next/server";

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) {
      return errorResponse("User ID not found", 400);
    }

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const inGame = await userIsInGame(gameId, userId);
    if (!inGame) {
      return errorResponse("You are not part of this game", 403);
    }

    const game = await getGame(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }

    const requestBody = await request.json();
    const parsed = rollEventPayloadSchema.safeParse(requestBody);
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const payload = parsed.data;
    const isGameMaster = game.gameMaster === userId;
    let characterIsPublic: boolean | null = null;
    let enemyInstanceIsPublic: boolean | null = null;

    if (payload.characterId) {
      const inThisGame = await characterIsInGame(gameId, payload.characterId);
      if (!inThisGame) {
        return errorResponse("Character is not in this game", 403);
      }

      characterIsPublic = await getGameCharacterLinkIsPublic(
        gameId,
        payload.characterId
      );

      if (
        !(await userHasPlayControlInGame(gameId, payload.characterId, userId))
      ) {
        return errorResponse(
          "You do not have play control of this character in this game",
          403
        );
      }
    }

    const enemyInstanceId = enemyInstanceIdFromRollMetadata(payload.metadata);
    if (enemyInstanceId) {
      enemyInstanceIsPublic = await getEnemyInstanceIsPublic(
        gameId,
        enemyInstanceId
      );
      if (enemyInstanceIsPublic === null) {
        return errorResponse("Enemy instance is not in this game", 403);
      }
    }

    const persistedIsPrivate = resolvePersistedRollIsPrivate({
      requestedIsPrivate: payload.isPrivate,
      isGameMaster,
      characterIsPublic,
      enemyInstanceIsPublic,
    });

    let diceExpression = payload.diceExpression;
    let total = payload.total;
    let persistedMetadata = rollMetadataWithPrivateFlag(
      payload.metadata,
      persistedIsPrivate
    );
    let attribution: string | undefined;
    let successes: number | undefined;
    let damageTotal: number | undefined;
    let pendingWeaponSpend: { id: string; currentUses: number } | null = null;
    let pendingReactionSpend: { holdingId: string; next: number } | null = null;

    if (payload.botCharacterId != null && payload.rollType === "INITIATIVE") {
      const characterId = payload.characterId;
      if (characterId == null) {
        return errorResponse(
          "Invalid request body",
          400,
          "A bot initiative roll needs the holding character."
        );
      }
      const row = await getBotCharacterRow(characterId, payload.botCharacterId);
      if (!row) {
        return errorResponse("Bot holding not found", 404);
      }
      const template = await resolveHoldingTemplate(row);
      if (!template) {
        return errorResponse(
          missingBotTemplateMessage(botHoldingSource(row)),
          404
        );
      }
      const roller = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      const rollerName = roller?.name?.trim() ?? "";
      const prepared = prepareBotInitiativeRoll({
        holding: presentBotHolding(row, template),
        results: payload.results,
        extraDice: payload.extraDice,
        isPrivate: persistedIsPrivate,
        rollerName: rollerName.length > 0 ? rollerName : "Unknown",
      });
      if (!prepared.ok) {
        return errorResponse(prepared.message, 400);
      }
      diceExpression = prepared.diceExpression;
      total = prepared.total;
      persistedMetadata = rollMetadataWithPrivateFlag(
        prepared.metadata,
        persistedIsPrivate
      );
      attribution = prepared.attribution;
    } else if (payload.botCharacterId != null) {
      const characterId = payload.characterId;
      const extraDice = payload.extraDice;
      const botCombat = payload.botCombat;
      const botAttribute = payload.botAttribute;
      const botAction = payload.botAction;
      const botItemAction = payload.botItemAction;
      if (characterId == null || extraDice == null) {
        return errorResponse(
          "Invalid request body",
          400,
          "A bot roll needs the holding character and extra dice."
        );
      }
      const chosen = [botCombat, botAttribute, botAction, botItemAction].filter(
        (choice) => choice != null
      ).length;
      if (chosen > 1) {
        return errorResponse(
          "Invalid request body",
          400,
          "Roll one bot action, one bot attribute, or one bot attack or defence."
        );
      }
      if (chosen === 0) {
        return errorResponse(
          "Invalid request body",
          400,
          "A bot attribute roll needs the holding character, one attribute, and extra dice."
        );
      }
      if (botAttribute != null && !isBotAttributeRoll(botAttribute)) {
        return errorResponse(
          "Roll one of Processing Power, Physical Power, Finesse Capacity, or Grid Protection. Battery is not rolled.",
          400
        );
      }
      if (botCombat != null && !isBotCombatValue(botCombat)) {
        return errorResponse(
          "Roll Attack Melee, Attack Range, Defence Melee, Defence Range, or Defence GRID.",
          400
        );
      }

      const row = await getBotCharacterRow(characterId, payload.botCharacterId);
      if (!row) {
        return errorResponse("Bot holding not found", 404);
      }
      const template = await resolveHoldingTemplate(row);
      if (!template) {
        return errorResponse(
          missingBotTemplateMessage(botHoldingSource(row)),
          404
        );
      }

      const roller = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      const rollerName = roller?.name?.trim() ?? "";
      const holding = presentBotHolding(row, template);
      const rollContext = {
        isPrivate: persistedIsPrivate,
        rollerName: rollerName.length > 0 ? rollerName : "Unknown",
      };

      if (botCombat != null) {
        const combatRoll =
          payload.rollType === "ATTACK_DAMAGE"
            ? "damage"
            : payload.rollType === "ATTACK"
              ? "attack"
              : payload.rollType === "DEFENCE" ||
                  payload.rollType === "GRID_DEFENCE"
                ? "defence"
                : null;
        if (combatRoll == null) {
          return errorResponse(
            "A bot attack or defence needs its roll type.",
            400
          );
        }
        const weaponId = payload.botWeaponItemCharacterId;
        const weapon =
          weaponId == null
            ? null
            : await loadBotHandWeapon({
                characterId,
                botCharacterId: payload.botCharacterId,
                itemCharacterId: weaponId,
              });
        if (weaponId != null && weapon == null) {
          return errorResponse(
            "That weapon is not a bot-equipped hand weapon for this attack.",
            400
          );
        }
        const prepared = prepareBotCombatRoll({
          holding,
          combat: botCombat,
          roll: combatRoll,
          weapon,
          extraDice,
          results: payload.results,
          ...rollContext,
        });
        if (!prepared.ok) {
          return errorResponse(prepared.message, 400);
        }
        if (prepared.spendUse && weapon != null) {
          pendingWeaponSpend = {
            id: weapon.itemCharacterId,
            currentUses: weapon.currentUses,
          };
        }
        if (prepared.spendReaction) {
          pendingReactionSpend = {
            holdingId: holding.id,
            next: holding.reactionsRemaining - 1,
          };
        }
        diceExpression = prepared.diceExpression;
        total = prepared.total;
        persistedMetadata = rollMetadataWithPrivateFlag(
          prepared.metadata,
          persistedIsPrivate
        );
        attribution = prepared.attribution;
        successes = prepared.successes;
      } else if (botAction != null || botItemAction != null) {
        let actions = readBotActionList(
          botAction?.list === "additionalActions"
            ? template.additionalActions
            : template.actions
        );
        let itemName: string | undefined;
        if (botItemAction != null) {
          const installed = await installedItemBotActions(
            characterId,
            payload.botCharacterId,
            botItemAction.itemCharacterId
          );
          if (!installed.ok) {
            return errorResponse(installed.message, installed.status);
          }
          actions = installed.actions;
          itemName = installed.itemName;
        }
        const index = botItemAction?.index ?? botAction?.index ?? 0;
        const action = actions[index];
        if (action == null) {
          return errorResponse(
            botItemAction != null
              ? "That bot action is not on this item."
              : "That bot action is not on this bot.",
            400
          );
        }
        const prepared = prepareBotActionRoll({
          holding,
          action,
          index,
          extraDice,
          results: payload.results,
          damageResults: payload.damageResults,
          itemCharacterId: botItemAction?.itemCharacterId,
          itemName,
          ...rollContext,
        });
        if (!prepared.ok) {
          return errorResponse(prepared.message, 400);
        }

        diceExpression = prepared.diceExpression;
        total = prepared.total;
        damageTotal = prepared.damageTotal;
        persistedMetadata = rollMetadataWithPrivateFlag(
          prepared.metadata,
          persistedIsPrivate
        );
        attribution = prepared.attribution;
        successes = prepared.successes;
      } else if (botAttribute != null) {
        const prepared = prepareBotAttributeRoll({
          holding,
          attribute: botAttribute,
          extraDice,
          results: payload.results,
          ...rollContext,
        });
        if (!prepared.ok) {
          return errorResponse(prepared.message, 400);
        }

        diceExpression = prepared.diceExpression;
        total = prepared.total;
        persistedMetadata = rollMetadataWithPrivateFlag(
          prepared.metadata,
          persistedIsPrivate
        );
        attribution = prepared.attribution;
        successes = prepared.successes;
      }
    }

    const integration = await prisma.discordIntegration.findUnique({
      where: { gameId },
    });

    const created = await prisma.rollEvent.create({
      data: {
        gameId,
        characterId: payload.characterId,
        rollerUserId: userId,
        rollType: payload.rollType,
        diceExpression,
        results: payload.results,
        total,
        metadata:
          persistedMetadata === undefined
            ? undefined
            : (persistedMetadata as Prisma.InputJsonValue),
      },
    });

    if (pendingWeaponSpend != null) {
      await spendBotWeaponUse(
        pendingWeaponSpend.id,
        pendingWeaponSpend.currentUses
      );
    }
    if (pendingReactionSpend != null) {
      await setBotReactionsRemaining(
        pendingReactionSpend.holdingId,
        pendingReactionSpend.next
      );
    }

    const queued =
      integration != null &&
      (integration.status === "ACTIVE" || integration.status === "DEGRADED");
    if (queued) {
      await prisma.discordOutbox.create({
        data: {
          rollEventId: created.id,
          integrationId: integration.id,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json(
      attribution == null
        ? { id: created.id, queued }
        : {
            id: created.id,
            queued,
            attribution,
            successes,
            ...(damageTotal !== undefined ? { damageTotal } : {}),
          },
      { status: 201 }
    );
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games/[id]/roll-events",
      message: "Error creating roll event",
      error,
    });
    return errorResponse(
      "Error creating roll event",
      500,
      serializeError(error)
    );
  }
});
