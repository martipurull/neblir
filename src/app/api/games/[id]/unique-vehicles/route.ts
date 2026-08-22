import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import { getUniqueVehiclesByGameId } from "@/app/lib/prisma/uniqueVehicle";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { logger } from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }
    const userId = request.auth.user.id;
    if (!userId) return errorResponse("User ID not found", 400);

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);

    const inGame = await userIsInGame(gameId, userId);
    if (!inGame) {
      return errorResponse("You are not part of this game", 403);
    }

    const vehicles = await getUniqueVehiclesByGameId(gameId);
    return NextResponse.json(vehicles);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[id]/unique-vehicles",
      message: "Error fetching unique vehicles",
      error,
    });
    return errorResponse(
      "Error fetching unique vehicles",
      500,
      serializeError(error)
    );
  }
});
