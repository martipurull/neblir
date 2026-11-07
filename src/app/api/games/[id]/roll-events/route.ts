import { errorResponse } from "@/app/api/shared/responses";
import {
  isBotAttributeRoll,
  prepareBotAttributeRoll,
} from "@/app/lib/botAttributeRoll";
import {
  botHoldingSource,
  missingBotTemplateMessage,
  presentBotHolding,
} from "@/app/lib/botHoldingView";
import {
  getBotCharacterRow,
  resolveHoldingTemplate,
} from "@/app/lib/prisma/botCharacter";
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

    if (payload.botCharacterId != null) {
      const characterId = payload.characterId;
      const botAttribute = payload.botAttribute;
      const extraDice = payload.extraDice;
      if (characterId == null || botAttribute == null || extraDice == null) {
        return errorResponse(
          "Invalid request body",
          400,
          "A bot attribute roll needs the holding character, one attribute, and extra dice."
        );
      }
      if (botAttribute === "battery") {
        return errorResponse("Battery is not rolled.", 400);
      }
      if (!isBotAttributeRoll(botAttribute)) {
        return errorResponse(
          "Roll one of Processing Power, Physical Power, Finesse Capacity, or Grid Protection.",
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
      const prepared = prepareBotAttributeRoll({
        holding: presentBotHolding(row, template),
        attribute: botAttribute,
        extraDice,
        results: payload.results,
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
      successes = prepared.successes;
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
        : { id: created.id, queued, attribution, successes },
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
