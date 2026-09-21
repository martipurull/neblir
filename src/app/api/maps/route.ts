import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import { createMap, getMaps } from "@/app/lib/prisma/map";
import { touchStaffCatalogueDrift } from "@/app/lib/prisma/staffCatalogueDrift";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { mapCreateSchema } from "@/app/lib/types/map";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../shared/errors";
import {
  responseIfOfficialNameTaken,
  responseIfOfficialNameUniqueConstraint,
} from "../shared/officialNameConflict";
import { errorResponse } from "../shared/responses";

const route = "/api/maps";

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    const gameId = request.nextUrl.searchParams.get("gameId");

    if (gameId) {
      const inGame = await userIsInGame(gameId, userId);
      if (!inGame) {
        return errorResponse("You are not part of this game", 403);
      }
    }

    const maps = await getMaps({ gameId: gameId ?? null });
    return NextResponse.json(maps, { status: 200 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "GET",
      route,
      message: "Error fetching maps",
      error,
      details,
    });
    return errorResponse("Error fetching maps", 500, details);
  }
});

export const POST = auth(async (request: AuthNextRequest) => {
  let officialWrite = false;
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    const requestBody = await request.json();
    const { data: parsedBody, error } = mapCreateSchema.safeParse(requestBody);
    if (error) {
      return errorResponse(
        "Error parsing map creation request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    if (parsedBody.gameId) {
      const game = await getGame(parsedBody.gameId);
      if (!game) {
        return errorResponse("Game not found", 404);
      }
      if (game.gameMaster !== userId) {
        return errorResponse("Only the game master can create maps", 403);
      }
    } else if (!(await userIsSuperAdmin(userId))) {
      return errorResponse("Forbidden", 403);
    }

    if (!parsedBody.gameId) {
      officialWrite = true;
      const conflict = responseIfOfficialNameTaken(
        await getMaps({ gameId: null }),
        parsedBody.name
      );
      if (conflict) return conflict;
    }

    const map = await createMap({
      ...parsedBody,
      gameId: parsedBody.gameId ?? null,
      protectedFromOfficialImport: !parsedBody.gameId,
    });
    if (officialWrite) {
      await touchStaffCatalogueDrift(["maps"]);
    }
    return NextResponse.json(map, { status: 201 });
  } catch (error) {
    if (officialWrite) {
      const uniqueConflict = responseIfOfficialNameUniqueConstraint(error);
      if (uniqueConflict) return uniqueConflict;
    }
    const details = serializeError(error);
    logger.error({
      method: "POST",
      route,
      message: "Error creating map",
      error,
      details,
    });
    return errorResponse("Error creating map", 500, details);
  }
});
