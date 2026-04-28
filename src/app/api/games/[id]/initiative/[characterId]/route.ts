import { getGameWithDetails, updateGame } from "@/app/lib/prisma/game";
import { shapeGameForResponse } from "@/app/lib/gameDetailResponse";
import { adjustInitiativeBodySchema } from "@/app/lib/types/initiative";
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

/** GM adjusts one character's initiative to move them up/down in order. */
export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
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

    const requestBody = await request.json();
    const parsed = adjustInitiativeBodySchema.safeParse(requestBody);
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }

    const game = await getGameWithDetails(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }

    if (game.gameMaster !== userId) {
      return errorResponse(
        "Only the game master can adjust initiative entries",
        403
      );
    }

    const existing = game.initiativeOrder ?? [];
    const targetIndex = existing.findIndex(
      (e) => e.characterId === characterId
    );
    if (targetIndex < 0) {
      return errorResponse("No initiative entry found for this character", 404);
    }

    const { initiativeDelta } = parsed.data;
    const updatedEntries = [...existing];
    const targetEntry = updatedEntries[targetIndex];
    updatedEntries[targetIndex] = {
      ...targetEntry,
      initiativeModifier: targetEntry.initiativeModifier + initiativeDelta,
    };

    await updateGame(gameId, { initiativeOrder: updatedEntries });

    const updated = await getGameWithDetails(gameId);
    if (!updated) {
      return errorResponse("Game not found after update", 500);
    }

    const payload = shapeGameForResponse(updated, userId);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/games/[id]/initiative/[characterId]",
      message: "Error adjusting initiative entry",
      error,
    });
    return errorResponse(
      "Error adjusting initiative entry",
      500,
      serializeError(error)
    );
  }
});
