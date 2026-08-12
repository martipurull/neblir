import { shapeGameForResponse } from "@/app/lib/gameDetailResponse";
import { getGameWithDetails } from "@/app/lib/prisma/game";
import { resetReactionsForInitiativeOrder } from "@/app/lib/prisma/resetInitiativeReactions";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

/**
 * POST /api/games/[id]/combat/reset-reactions
 * GM-only: reset reactionsRemaining to max for every combatant currently in
 * this game's initiative order (characters and enemy instances).
 */
export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/games/[id]/combat/reset-reactions",
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
      return errorResponse(
        "Only the game master can reset combat reactions",
        403
      );
    }

    await resetReactionsForInitiativeOrder(gameId, game.initiativeOrder ?? []);

    const updated = await getGameWithDetails(gameId);
    if (!updated) {
      return errorResponse("Game not found after update", 500);
    }

    const payload = shapeGameForResponse(updated, userId);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games/[id]/combat/reset-reactions",
      message: "Error resetting combat reactions",
      error,
    });
    return errorResponse(
      "Error resetting combat reactions",
      500,
      serializeError(error)
    );
  }
});
