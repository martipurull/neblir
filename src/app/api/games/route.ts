import { createGame, getUserGames } from "@/app/lib/prisma/game";
import { AuthNextRequest } from "@/app/lib/types/api";
import { gameSchema } from "@/app/lib/types/game";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/games",
        message: "Unauthorised access attempt",
      });
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } = gameSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "POST",
        route: "/api/games",
        message: "Error parsing game creation request",
        details: error,
      });
      return NextResponse.json({ message: error.issues }, { status: 400 });
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
    return NextResponse.error();
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
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    const userId = request.auth.user.id;
    if (!userId) {
      logger.error({
        method: "GET",
        route: "/api/games",
        message: "User ID not found",
        userId,
      });
      return NextResponse.json({
        message: `User with id ${userId} does not exist`,
        status: 400,
      });
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
    return NextResponse.error();
  }
});
