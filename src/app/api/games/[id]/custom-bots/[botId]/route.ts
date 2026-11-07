import { getCustomBot, updateCustomBot } from "@/app/lib/prisma/customBot";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import { customBotUpdateSchema } from "@/app/lib/types/bot";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id: gameId, botId } = (await params) as {
      id: string;
      botId: string;
    };
    if (!gameId || !botId) {
      return errorResponse("Invalid game or custom bot ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }

    const isGameMaster = game.gameMaster === request.auth.user.id;
    const isInGame = await userIsInGame(gameId, request.auth.user.id);
    if (!isGameMaster && !isInGame) {
      return errorResponse("You do not have access to this game.", 403);
    }

    const bot = await getCustomBot(botId);
    if (bot?.gameId !== gameId) {
      return errorResponse("Custom bot not found", 404);
    }

    return NextResponse.json(bot);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[id]/custom-bots/[botId]",
      message: "Error fetching custom bot",
      error,
    });
    return errorResponse(
      "Error fetching custom bot",
      500,
      serializeError(error)
    );
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id: gameId, botId } = (await params) as {
      id: string;
      botId: string;
    };
    if (!gameId || !botId) {
      return errorResponse("Invalid game or custom bot ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }
    if (game.gameMaster !== request.auth.user.id) {
      return errorResponse(
        "Only the game master can update custom bots for this game.",
        403
      );
    }

    const existing = await getCustomBot(botId);
    if (existing?.gameId !== gameId) {
      return errorResponse("Custom bot not found", 404);
    }

    const parsed = customBotUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Error parsing custom bot update request",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const updated = await updateCustomBot(botId, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/games/[id]/custom-bots/[botId]",
      message: "Error updating custom bot",
      error,
    });
    return errorResponse(
      "Error updating custom bot",
      500,
      serializeError(error)
    );
  }
});
