import {
  getGameWithDetails,
  deleteGame,
  updateGame,
  userIsInGame,
} from "@/app/lib/prisma/game";
import { shapeGameForResponse } from "@/app/lib/gameDetailResponse";
import { auth } from "@/auth";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { NextResponse } from "next/server";
import { gameUpdateSchema } from "@/app/lib/types/game";
import logger from "@/logger";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/games/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) {
      return errorResponse("User ID not found", 400);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "GET",
        route: "/api/games/[id]",
        message: "Invalid game ID",
        gameId: id,
      });
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGameWithDetails(id);
    if (!game) {
      logger.error({
        method: "GET",
        route: "/api/games/[id]",
        message: "Game not found",
        gameId: id,
      });
      return errorResponse("Game not found", 404);
    }

    const inGame = await userIsInGame(id, userId);
    if (!inGame) {
      return errorResponse("You are not part of this game", 403);
    }

    const payload = shapeGameForResponse(game, userId);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[id]",
      message: "Error fetching game",
      error,
    });
    return errorResponse("Error fetching game", 500, serializeError(error));
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/games/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "PATCH",
        route: "/api/games/[id]",
        message: "Invalid game ID",
        gameId: id,
      });
      return errorResponse("Invalid game ID", 400);
    }

    const userId = request.auth.user.id;
    if (!userId) {
      return errorResponse("User ID not found", 400);
    }

    const game = await getGameWithDetails(id);
    if (!game) {
      return errorResponse("Game not found", 404);
    }
    if (game.gameMaster !== userId) {
      return errorResponse("Only the game master can update this game", 403);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } = gameUpdateSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "PATCH",
        route: "/api/games/[id]",
        message: "Error parsing game update request",
        details: error,
      });
      return errorResponse(
        "Error parsing game update request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    await updateGame(id, parsedBody);
    const updatedGame = await getGameWithDetails(id);
    if (!updatedGame) {
      return errorResponse("Game not found after update", 500);
    }
    const payload = shapeGameForResponse(updatedGame, userId);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/games/[id]",
      message: "Error updating game",
      error,
    });
    return errorResponse("Error updating game", 500, serializeError(error));
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "DELETE",
        route: "/api/games/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "DELETE",
        route: "/api/games/[id]",
        message: "Invalid game ID",
        gameId: id,
      });
      return errorResponse("Invalid game ID", 400);
    }

    await deleteGame(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/games/[id]",
      message: "Error deleting game",
      error,
    });
    return errorResponse("Error deleting game", 500, serializeError(error));
  }
});
