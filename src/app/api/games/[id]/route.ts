import { getGame, deleteGame, updateGame } from "@/app/lib/prisma/game";
import { auth } from "@/auth";
import { AuthNextRequest } from "@/app/lib/types/api";
import { NextResponse } from "next/server";
import { gameUpdateSchema } from "@/app/lib/types/game";
import logger from "@/logger";
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

    const game = await getGame(id);
    if (!game) {
      logger.error({
        method: "GET",
        route: "/api/games/[id]",
        message: "Game not found",
        gameId: id,
      });
      return errorResponse("Game not found", 404);
    }

    return NextResponse.json(game, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[id]",
      message: "Error fetching game",
      error,
    });
    return errorResponse("Error fetching game", 500, JSON.stringify(error));
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

    const updatedGame = await updateGame(id, parsedBody);

    return NextResponse.json(updatedGame, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/games/[id]",
      message: "Error updating game",
      error,
    });
    return errorResponse("Error updating game", 500, JSON.stringify(error));
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
    return errorResponse("Error deleting game", 500, JSON.stringify(error));
  }
});
