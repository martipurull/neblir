import {
  deleteCustomEnemy,
  getCustomEnemy,
  updateCustomEnemy,
} from "@/app/lib/prisma/customEnemy";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import { customEnemyUpdateSchema } from "@/app/lib/types/enemy";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) return errorResponse("Unauthorised", 401);

    const { id: gameId, customEnemyId } = (await params) as {
      id: string;
      customEnemyId: string;
    };
    if (!gameId || !customEnemyId) {
      return errorResponse("Invalid game or custom enemy ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);

    const isGameMaster = game.gameMaster === request.auth.user.id;
    const isInGame = await userIsInGame(gameId, request.auth.user.id);
    if (!isGameMaster && !isInGame) {
      return errorResponse("You do not have access to this game.", 403);
    }

    const enemy = await getCustomEnemy(customEnemyId);
    if (enemy?.gameId !== gameId) {
      return errorResponse("Custom enemy not found", 404);
    }

    return NextResponse.json(enemy);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[id]/custom-enemies/[customEnemyId]",
      message: "Error fetching custom enemy",
      error,
    });
    return errorResponse(
      "Error fetching custom enemy",
      500,
      serializeError(error)
    );
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) return errorResponse("Unauthorised", 401);

    const { id: gameId, customEnemyId } = (await params) as {
      id: string;
      customEnemyId: string;
    };
    if (!gameId || !customEnemyId) {
      return errorResponse("Invalid game or custom enemy ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== request.auth.user.id) {
      return errorResponse(
        "Only the game master can update custom enemies for this game.",
        403
      );
    }

    const existing = await getCustomEnemy(customEnemyId);
    if (existing?.gameId !== gameId) {
      return errorResponse("Custom enemy not found", 404);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      customEnemyUpdateSchema.safeParse(requestBody);
    if (error) {
      return errorResponse(
        "Error parsing custom enemy update request",
        400,
        error.issues.map((i) => i.message).join(". ")
      );
    }

    const updated = await updateCustomEnemy(customEnemyId, parsedBody);
    return NextResponse.json(updated);
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/games/[id]/custom-enemies/[customEnemyId]",
      message: "Error updating custom enemy",
      error,
    });
    return errorResponse(
      "Error updating custom enemy",
      500,
      serializeError(error)
    );
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) return errorResponse("Unauthorised", 401);

    const { id: gameId, customEnemyId } = (await params) as {
      id: string;
      customEnemyId: string;
    };
    if (!gameId || !customEnemyId) {
      return errorResponse("Invalid game or custom enemy ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== request.auth.user.id) {
      return errorResponse(
        "Only the game master can delete custom enemies for this game.",
        403
      );
    }

    const existing = await getCustomEnemy(customEnemyId);
    if (existing?.gameId !== gameId) {
      return errorResponse("Custom enemy not found", 404);
    }

    await deleteCustomEnemy(customEnemyId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/games/[id]/custom-enemies/[customEnemyId]",
      message: "Error deleting custom enemy",
      error,
    });
    return errorResponse(
      "Error deleting custom enemy",
      500,
      serializeError(error)
    );
  }
});
