import { shapeGameForResponse } from "@/app/lib/gameDetailResponse";
import { getGameWithDetails } from "@/app/lib/prisma/game";
import { userIsGameMaster } from "@/app/lib/prisma/gameCharacter";
import { removePlayerFromGame } from "@/app/lib/prisma/gameMembership";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

/** GM removes a player (and their characters) from the game. */
export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const requesterId = request.auth.user.id;
    if (!requesterId) {
      return errorResponse("User ID not found", 400);
    }

    const { id: gameId, userId: targetUserId } = (await params) as {
      id: string;
      userId: string;
    };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }
    if (!targetUserId || typeof targetUserId !== "string") {
      return errorResponse("Invalid user ID", 400);
    }

    if (!(await userIsGameMaster(gameId, requesterId))) {
      return errorResponse("Only the game master can remove players", 403);
    }

    const result = await removePlayerFromGame(gameId, targetUserId);
    if (!result.ok) {
      if (result.reason === "not_found") {
        return errorResponse("Game not found", 404);
      }
      if (result.reason === "cannot_remove_gm") {
        return errorResponse(
          "The game master cannot be removed from the game",
          400
        );
      }
      return errorResponse("User is not part of this game", 404);
    }

    const updated = await getGameWithDetails(gameId);
    if (!updated) {
      return errorResponse("Game not found after update", 500);
    }

    const payload = shapeGameForResponse(updated, requesterId);
    return NextResponse.json(
      {
        success: true,
        removedUserId: targetUserId,
        removedCharacterIds: result.removedCharacterIds,
        game: payload,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/games/[id]/users/[userId]",
      message: "Error removing player from game",
      error,
    });
    return errorResponse(
      "Error removing player from game",
      500,
      serializeError(error)
    );
  }
});
