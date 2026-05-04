import { getGameWithDetails, updateGame } from "@/app/lib/prisma/game";
import { shapeGameForResponse } from "@/app/lib/gameDetailResponse";
import { adjustInitiativeBodySchema } from "@/app/lib/types/initiative";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

function parseCombatantRef(raw: string): {
  combatantType: "CHARACTER" | "ENEMY";
  combatantId: string;
} {
  const [maybeType, ...rest] = raw.split(":");
  if ((maybeType === "CHARACTER" || maybeType === "ENEMY") && rest.length > 0) {
    return { combatantType: maybeType, combatantId: rest.join(":") };
  }
  throw new Error("Invalid combatant reference format");
}

/** GM removes one initiative entry so it can be rolled again. */
export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "DELETE",
        route: "/api/games/[id]/initiative/[combatantId]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) return errorResponse("User ID not found", 400);

    const { id: gameId, characterId: combatantRef } = (await params) as {
      id: string;
      characterId: string;
    };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }
    if (!combatantRef || typeof combatantRef !== "string") {
      return errorResponse("Invalid combatant ID", 400);
    }
    let combatantType: "CHARACTER" | "ENEMY";
    let combatantId: string;
    try {
      ({ combatantType, combatantId } = parseCombatantRef(combatantRef));
    } catch {
      return errorResponse("Invalid combatant ID", 400);
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
    const filtered = existing.filter(
      (e) =>
        !(e.combatantType === combatantType && e.combatantId === combatantId)
    );
    if (filtered.length === existing.length) {
      return errorResponse("No initiative entry found for this combatant", 404);
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
      route: "/api/games/[id]/initiative/[combatantId]",
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

/** GM adjusts one initiative entry to move it up/down in order. */
export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/games/[id]/initiative/[combatantId]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) return errorResponse("User ID not found", 400);

    const { id: gameId, characterId: combatantRef } = (await params) as {
      id: string;
      characterId: string;
    };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }
    if (!combatantRef || typeof combatantRef !== "string") {
      return errorResponse("Invalid combatant ID", 400);
    }
    let combatantType: "CHARACTER" | "ENEMY";
    let combatantId: string;
    try {
      ({ combatantType, combatantId } = parseCombatantRef(combatantRef));
    } catch {
      return errorResponse("Invalid combatant ID", 400);
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
      (e) => e.combatantType === combatantType && e.combatantId === combatantId
    );
    if (targetIndex < 0) {
      return errorResponse("No initiative entry found for this combatant", 404);
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
      route: "/api/games/[id]/initiative/[combatantId]",
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
