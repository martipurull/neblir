import { getBots } from "@/app/lib/prisma/bot";
import { getGame } from "@/app/lib/prisma/game";
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

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }
    if (game.gameMaster !== request.auth.user.id) {
      return errorResponse(
        "Only the game master can browse official bots for this game.",
        403
      );
    }

    const bots = await getBots();
    return NextResponse.json(bots);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[gameId]/official-bots",
      message: "Error fetching official bots for a game master",
      error,
    });
    return errorResponse(
      "Error fetching official bots",
      500,
      serializeError(error)
    );
  }
});
