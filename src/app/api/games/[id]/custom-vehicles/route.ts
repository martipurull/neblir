import {
  createCustomVehicle,
  getCustomVehiclesByGame,
} from "@/app/lib/prisma/vehicle";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import {
  customVehicleCreateSchema,
  type CustomVehicleCreate,
} from "@/app/lib/types/vehicle";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { logger } from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

const customVehicleCreateBodySchema = customVehicleCreateSchema.omit({
  gameId: true,
});

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/games/[gameId]/custom-vehicles",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }

    const isGameMaster = game.gameMaster === request.auth.user.id;
    const isInGame = await userIsInGame(gameId, request.auth.user.id);
    if (!isGameMaster && !isInGame) {
      return errorResponse("You do not have access to this game.", 403);
    }

    const vehicles = await getCustomVehiclesByGame(gameId);
    return NextResponse.json(vehicles);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[gameId]/custom-vehicles",
      message: "Error fetching custom vehicles",
      error,
    });
    return errorResponse(
      "Error fetching custom vehicles",
      500,
      serializeError(error)
    );
  }
});

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/games/[gameId]/custom-vehicles",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }
    const isGameMaster = game.gameMaster === request.auth.user.id;
    if (!isGameMaster) {
      return errorResponse(
        "Only the game master can create custom vehicles for this game.",
        403
      );
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      customVehicleCreateBodySchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "POST",
        route: "/api/games/[gameId]/custom-vehicles",
        message: "Error parsing custom vehicle creation request",
        details: error,
      });
      return errorResponse(
        "Error parsing custom vehicle creation request",
        400,
        error.issues.map((i) => i.message).join(". ")
      );
    }

    const createData: CustomVehicleCreate = {
      ...parsedBody,
      gameId,
    };

    const vehicle = await createCustomVehicle(createData);

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games/[gameId]/custom-vehicles",
      message: "Error creating custom vehicle",
      error,
    });
    return errorResponse(
      "Error creating custom vehicle",
      500,
      serializeError(error)
    );
  }
});
