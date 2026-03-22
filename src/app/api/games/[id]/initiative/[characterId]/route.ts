import { getGameWithDetails, updateGame } from "@/app/lib/prisma/game";
import { shapeGameForResponse } from "@/app/lib/gameDetailResponse";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

/** GM removes one character's initiative entry so they can roll again. */
export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "DELETE",
        route: "/api/games/[id]/initiative/[characterId]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) return errorResponse("User ID not found", 400);

    const { id: gameId, characterId } = (await params) as {
      id: string;
      characterId: string;
    };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }
    if (!characterId || typeof characterId !== "string") {
      return errorResponse("Invalid character ID", 400);
    }

    const game = await getGameWithDetails(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }

    if (game.gameMaster !== userId) {
      return errorResponse(
        "Only the game master can remove initiative entries",
        403
      );
    }

    const existing = game.initiativeOrder ?? [];
    const filtered = existing.filter((e) => e.characterId !== characterId);
    if (filtered.length === existing.length) {
      return errorResponse("No initiative entry found for this character", 404);
    }

    await updateGame(gameId, { initiativeOrder: filtered });

    const updated = await getGameWithDetails(gameId);
    if (!updated) {
      return errorResponse("Game not found after update", 500);
    }

    const payload = shapeGameForResponse(updated, userId);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/games/[id]/initiative/[characterId]",
      message: "Error removing initiative entry",
      error,
    });
    return errorResponse(
      "Error removing initiative entry",
      500,
      serializeError(error)
    );
  }
});
