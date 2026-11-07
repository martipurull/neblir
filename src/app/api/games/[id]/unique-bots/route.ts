import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import { getUniqueBotsByGameId } from "@/app/lib/prisma/uniqueBot";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }
    const userId = request.auth.user.id;
    if (!userId) return errorResponse("User ID not found", 400);

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);

    const isGameMaster = game.gameMaster === userId;
    const inGame = await userIsInGame(gameId, userId);
    if (!isGameMaster && !inGame) {
      return errorResponse("You are not part of this game", 403);
    }

    const bots = await getUniqueBotsByGameId(gameId);
    return NextResponse.json(bots);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[id]/unique-bots",
      message: "Error fetching unique bots",
      error,
    });
    return errorResponse(
      "Error fetching unique bots",
      500,
      serializeError(error)
    );
  }
});
