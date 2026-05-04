import {
  createCustomEnemy,
  getCustomEnemiesByGame,
} from "@/app/lib/prisma/customEnemy";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import { customEnemyCreateBodySchema } from "@/app/lib/types/enemy";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) return errorResponse("Unauthorised", 401);

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);

    const isGameMaster = game.gameMaster === request.auth.user.id;
    const isInGame = await userIsInGame(gameId, request.auth.user.id);
    if (!isGameMaster && !isInGame) {
      return errorResponse("You do not have access to this game.", 403);
    }

    const enemies = await getCustomEnemiesByGame(gameId);
    return NextResponse.json(enemies);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[id]/custom-enemies",
      message: "Error fetching custom enemies",
      error,
    });
    return errorResponse(
      "Error fetching custom enemies",
      500,
      serializeError(error)
    );
  }
});

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) return errorResponse("Unauthorised", 401);

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== request.auth.user.id) {
      return errorResponse(
        "Only the game master can create custom enemies for this game.",
        403
      );
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      customEnemyCreateBodySchema.safeParse(requestBody);
    if (error) {
      return errorResponse(
        "Error parsing custom enemy creation request",
        400,
        error.issues.map((i) => i.message).join(". ")
      );
    }

    const created = await createCustomEnemy({
      ...parsedBody,
      gameId,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games/[id]/custom-enemies",
      message: "Error creating custom enemy",
      error,
    });
    return errorResponse(
      "Error creating custom enemy",
      500,
      serializeError(error)
    );
  }
});
