import { createGame, getUserGames } from "@/app/lib/prisma/game";
import { AuthNextRequest } from "@/app/lib/types/api";
import { gameCreateSchema } from "@/app/lib/types/game";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { errorResponse } from "../shared/responses";

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/games",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } = gameCreateSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "POST",
        route: "/api/games",
        message: "Error parsing game creation request",
        details: error,
      });
      return errorResponse(
        "Error parsing game creation request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const game = await createGame(parsedBody);

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games",
      message: "Error creating game",
      error,
    });
    return errorResponse("Error creating game", 500, JSON.stringify(error));
  }
});

// Get all games for the authenticated user
export const GET = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/games",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) {
      logger.error({
        method: "GET",
        route: "/api/games",
        message: "User ID not found",
        userId,
      });
      return errorResponse(`User with id ${userId} does not exist`, 400);
    }
    const userGames = await getUserGames(userId);

    return NextResponse.json(userGames, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games",
      message: "Error fetching games",
      error,
    });
    return errorResponse("Error fetching games", 500, JSON.stringify(error));
  }
});
