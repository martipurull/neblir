import { deleteMap, getMap, updateMap } from "@/app/lib/prisma/map";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { mapUpdateSchema } from "@/app/lib/types/map";
import { auth } from "@/auth";
import logger from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

const route = "/api/maps/[id]";

async function canReadMap(
  map: { gameId: string | null },
  userId: string
): Promise<boolean> {
  if (!map.gameId) return true;
  return userIsInGame(map.gameId, userId);
}

async function canWriteMap(
  map: { gameId: string | null },
  userId: string
): Promise<boolean> {
  if (!map.gameId) return true;
  const game = await getGame(map.gameId);
  return game?.gameMaster === userId;
}

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    const map = await getMap(id);
    if (!map) {
      return errorResponse("Map not found", 404);
    }

    const canRead = await canReadMap(map, request.auth.user.id);
    if (!canRead) {
      return errorResponse("You cannot access this map", 403);
    }

    return NextResponse.json(map, { status: 200 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "GET",
      route,
      message: "Error fetching map",
      error,
      details,
    });
    return errorResponse("Error fetching map", 500, details);
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    const existing = await getMap(id);
    if (!existing) {
      return errorResponse("Map not found", 404);
    }

    const canWriteExisting = await canWriteMap(existing, request.auth.user.id);
    if (!canWriteExisting) {
      return errorResponse("You cannot update this map", 403);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } = mapUpdateSchema.safeParse(requestBody);
    if (error) {
      return errorResponse(
        "Error parsing map update request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const nextGameId =
      parsedBody.gameId === undefined ? existing.gameId : parsedBody.gameId;
    if (nextGameId && nextGameId !== existing.gameId) {
      const nextGame = await getGame(nextGameId);
      if (!nextGame) {
        return errorResponse("Game not found", 404);
      }
      if (nextGame.gameMaster !== request.auth.user.id) {
        return errorResponse("Only the game master can move this map", 403);
      }
    }

    const updated = await updateMap(id, parsedBody);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "PATCH",
      route,
      message: "Error updating map",
      error,
      details,
    });
    return errorResponse("Error updating map", 500, details);
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    const existing = await getMap(id);
    if (!existing) {
      return errorResponse("Map not found", 404);
    }

    const canWrite = await canWriteMap(existing, request.auth.user.id);
    if (!canWrite) {
      return errorResponse("You cannot delete this map", 403);
    }

    await deleteMap(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "DELETE",
      route,
      message: "Error deleting map",
      error,
      details,
    });
    return errorResponse("Error deleting map", 500, details);
  }
});
