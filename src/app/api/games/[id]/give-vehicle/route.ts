import { getGame } from "@/app/lib/prisma/game";
import { characterIsInGame } from "@/app/lib/prisma/gameCharacter";
import { getUniqueVehicle } from "@/app/lib/prisma/uniqueVehicle";
import {
  createVehicleCharacter,
  getHydratedVehicleCharacter,
  getInitialCurrentHpForVehicle,
  VehicleCharacterConflictError,
} from "@/app/lib/prisma/vehicleCharacter";
import { getCustomVehicle, getVehicle } from "@/app/lib/prisma/vehicle";
import { giveVehicleSchema } from "@/app/lib/types/vehicle";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { logger } from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) {
      return errorResponse("User ID not found", 400);
    }

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }
    if (game.gameMaster !== userId) {
      return errorResponse(
        "Only the game master can give vehicles in this game",
        403
      );
    }

    const parsed = giveVehicleSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const { characterId, sourceType, vehicleId } = parsed.data;

    const inGame = await characterIsInGame(gameId, characterId);
    if (!inGame) {
      return errorResponse("Character is not in this game", 403);
    }

    if (sourceType === "GLOBAL_VEHICLE") {
      const vehicle = await getVehicle(vehicleId);
      if (!vehicle) {
        return errorResponse("Vehicle not found", 404);
      }
    }

    if (sourceType === "CUSTOM_VEHICLE") {
      const vehicle = await getCustomVehicle(vehicleId);
      if (!vehicle) {
        return errorResponse("Custom vehicle not found", 404);
      }
      if (vehicle.gameId !== gameId) {
        return errorResponse(
          "Custom vehicle does not belong to this game",
          403
        );
      }
    }

    if (sourceType === "UNIQUE_VEHICLE") {
      const vehicle = await getUniqueVehicle(vehicleId);
      if (!vehicle) {
        return errorResponse("Unique vehicle not found", 404);
      }
      if (vehicle.gameId !== gameId) {
        return errorResponse(
          "Unique vehicle does not belong to this game",
          403
        );
      }
    }

    const currentHp = await getInitialCurrentHpForVehicle(
      sourceType,
      vehicleId
    );
    const created = await createVehicleCharacter(
      characterId,
      sourceType,
      vehicleId,
      {
        currentHp,
      }
    );
    const hydrated = await getHydratedVehicleCharacter(created.id);

    return NextResponse.json(hydrated ?? created, { status: 201 });
  } catch (error) {
    if (error instanceof VehicleCharacterConflictError) {
      return errorResponse(error.message, 409);
    }

    logger.error({
      method: "POST",
      route: "/api/games/[id]/give-vehicle",
      message: "Error giving vehicle",
      error,
    });
    return errorResponse(
      "Error giving vehicle to character",
      500,
      serializeError(error)
    );
  }
});
