import {
  getGameWithDetails,
  updateGame,
  userIsInGame,
} from "@/app/lib/prisma/game";
import { prepareBotInitiativeRoll } from "@/app/lib/botInitiative";
import {
  botHoldingSource,
  missingBotTemplateMessage,
  presentBotHolding,
} from "@/app/lib/botHoldingView";
import {
  getBotCharacterById,
  resolveHoldingTemplate,
} from "@/app/lib/prisma/botCharacter";
import {
  characterIsInGame,
  userHasPlayControlInGame,
  userOwnsCharacter,
} from "@/app/lib/prisma/gameCharacter";
import { getEnemyInstance } from "@/app/lib/prisma/enemyInstance";
import { shapeGameForResponse } from "@/app/lib/gameDetailResponse";
import { submitInitiativeBodySchema } from "@/app/lib/types/initiative";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { logger } from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/games/[id]/initiative",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) return errorResponse("User ID not found", 400);

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const inGame = await userIsInGame(gameId, userId);
    if (!inGame) {
      return errorResponse("You are not part of this game", 403);
    }

    const requestBody = await request.json();
    const parsed = submitInitiativeBodySchema.safeParse(requestBody);
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }

    const { combatantType, combatantId, rolledValue } = parsed.data;
    const combatantName =
      parsed.data.combatantType === "BOT"
        ? undefined
        : parsed.data.combatantName;
    const initiativeModifier =
      parsed.data.combatantType === "BOT"
        ? undefined
        : parsed.data.initiativeModifier;

    const game = await getGameWithDetails(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }

    const isGameMaster = game.gameMaster === userId;
    let resolvedCombatantName: string | undefined = combatantName;
    let resolvedModifier = initiativeModifier;
    if (combatantType === "CHARACTER") {
      const inThisGame = await characterIsInGame(gameId, combatantId);
      if (!inThisGame) {
        return errorResponse("Character is not in this game", 403);
      }
      const owns = await userOwnsCharacter(combatantId, userId);
      if (!isGameMaster && !owns) {
        return errorResponse(
          "You can only submit initiative for your own character",
          403
        );
      }
      const character = game.characters.find(
        (gc) => gc.character.id === combatantId
      )?.character;
      const name = character?.generalInformation?.name ?? "";
      const surname = character?.generalInformation?.surname ?? "";
      resolvedCombatantName = `${name}${surname ? ` ${surname}` : ""}`.trim();
    } else if (combatantType === "BOT") {
      const row = await getBotCharacterById(combatantId);
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
      const holding = presentBotHolding(row, template);
      const inThisGame = await characterIsInGame(gameId, holding.characterId);
      if (!inThisGame) {
        return errorResponse("Character is not in this game", 403);
      }
      if (
        !(await userHasPlayControlInGame(gameId, holding.characterId, userId))
      ) {
        return errorResponse(
          "You do not have play control of this character in this game",
          403
        );
      }
      const prepared = prepareBotInitiativeRoll({
        holding,
        results: [rolledValue],
        extraDice: parsed.data.extraDice,
        isPrivate: false,
        rollerName: "",
      });
      if (!prepared.ok) {
        return errorResponse(prepared.message, 400);
      }
      resolvedCombatantName = holding.displayName;
      resolvedModifier = prepared.modifier;
    } else {
      if (!isGameMaster) {
        return errorResponse(
          "Only the game master can submit initiative for enemies",
          403
        );
      }
      const enemyInstance = await getEnemyInstance(combatantId);
      const validEnemyInstance =
        enemyInstance?.gameId === gameId ? enemyInstance : null;
      if (!validEnemyInstance) {
        return errorResponse("Enemy instance not found", 404);
      }
      resolvedCombatantName = validEnemyInstance.name;
    }
    if (!resolvedCombatantName) {
      return errorResponse("Combatant name could not be resolved", 400);
    }
    if (resolvedModifier == null) {
      return errorResponse("Initiative modifier could not be resolved", 400);
    }

    const existing = game.initiativeOrder ?? [];
    if (
      existing.some(
        (e) =>
          e.combatantType === combatantType && e.combatantId === combatantId
      )
    ) {
      return errorResponse(
        "Initiative has already been submitted for this combatant in this game",
        409
      );
    }

    const submittedAt = new Date();
    await updateGame(gameId, {
      initiativeOrder: [
        ...existing,
        {
          combatantType,
          combatantId,
          combatantName: resolvedCombatantName,
          rolledValue,
          initiativeModifier: resolvedModifier,
          submittedAt,
        },
      ],
    });

    const updated = await getGameWithDetails(gameId);
    if (!updated) {
      return errorResponse("Game not found after update", 500);
    }

    const payload = shapeGameForResponse(updated, userId);
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games/[id]/initiative",
      message: "Error submitting initiative",
      error,
    });
    return errorResponse(
      "Error submitting initiative",
      500,
      serializeError(error)
    );
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "DELETE",
        route: "/api/games/[id]/initiative",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) return errorResponse("User ID not found", 400);

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGameWithDetails(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }

    if (game.gameMaster !== userId) {
      return errorResponse("Only the game master can clear initiative", 403);
    }

    await updateGame(gameId, { initiativeOrder: [] });

    const updated = await getGameWithDetails(gameId);
    if (!updated) {
      return errorResponse("Game not found after update", 500);
    }

    const payload = shapeGameForResponse(updated, userId);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/games/[id]/initiative",
      message: "Error clearing initiative",
      error,
    });
    return errorResponse(
      "Error clearing initiative",
      500,
      serializeError(error)
    );
  }
});
