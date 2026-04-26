import {
  deleteReferenceEntry,
  getReferenceEntry,
  updateReferenceEntry,
} from "@/app/lib/prisma/referenceEntry";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { referenceEntryUpdateSchema } from "@/app/lib/types/reference";
import { auth } from "@/auth";
import logger from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

const route = "/api/reference-entries/[id]";

async function canReadReferenceEntry(
  entry: { gameId: string | null; access: "PLAYER" | "GAME_MASTER" },
  userId: string
): Promise<boolean> {
  if (!entry.gameId) return entry.access === "PLAYER";

  const inGame = await userIsInGame(entry.gameId, userId);
  if (!inGame) return false;

  if (entry.access === "PLAYER") return true;
  const game = await getGame(entry.gameId);
  return game?.gameMaster === userId;
}

async function canWriteReferenceEntry(
  entry: { gameId: string | null },
  userId: string
): Promise<boolean> {
  if (!entry.gameId) return true;

  const game = await getGame(entry.gameId);
  return game?.gameMaster === userId;
}

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    const entry = await getReferenceEntry(id);
    if (!entry) {
      return errorResponse("Reference entry not found", 404);
    }

    const canRead = await canReadReferenceEntry(entry, request.auth.user.id);
    if (!canRead) {
      return errorResponse("You cannot access this reference entry", 403);
    }

    return NextResponse.json(entry, { status: 200 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "GET",
      route,
      message: "Error fetching reference entry",
      error,
      details,
    });
    return errorResponse("Error fetching reference entry", 500, details);
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    const existing = await getReferenceEntry(id);
    if (!existing) {
      return errorResponse("Reference entry not found", 404);
    }

    const canWriteExisting = await canWriteReferenceEntry(
      existing,
      request.auth.user.id
    );
    if (!canWriteExisting) {
      return errorResponse("You cannot update this reference entry", 403);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      referenceEntryUpdateSchema.safeParse(requestBody);
    if (error) {
      return errorResponse(
        "Error parsing reference entry update request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const nextGameId =
      parsedBody.gameId === undefined ? existing.gameId : parsedBody.gameId;
    const nextCategory = parsedBody.category ?? existing.category;
    if (nextCategory === "CAMPAIGN_LORE" && !nextGameId) {
      return errorResponse("CAMPAIGN_LORE entries require a gameId", 400);
    }

    if (nextGameId && nextGameId !== existing.gameId) {
      const nextGame = await getGame(nextGameId);
      if (!nextGame) {
        return errorResponse("Game not found", 404);
      }
      if (nextGame.gameMaster !== request.auth.user.id) {
        return errorResponse(
          "Only the game master can move this reference entry",
          403
        );
      }
    }

    const updated = await updateReferenceEntry(id, parsedBody);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "PATCH",
      route,
      message: "Error updating reference entry",
      error,
      details,
    });
    return errorResponse("Error updating reference entry", 500, details);
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    const existing = await getReferenceEntry(id);
    if (!existing) {
      return errorResponse("Reference entry not found", 404);
    }

    const canWrite = await canWriteReferenceEntry(
      existing,
      request.auth.user.id
    );
    if (!canWrite) {
      return errorResponse("You cannot delete this reference entry", 403);
    }

    await deleteReferenceEntry(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "DELETE",
      route,
      message: "Error deleting reference entry",
      error,
      details,
    });
    return errorResponse("Error deleting reference entry", 500, details);
  }
});
