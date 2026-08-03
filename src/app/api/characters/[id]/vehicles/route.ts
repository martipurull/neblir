import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import { characterIsInGame } from "@/app/lib/prisma/gameCharacter";
import { getUniqueVehicle } from "@/app/lib/prisma/uniqueVehicle";
import {
  createVehicleCharacter,
  getCharacterVehicles,
  getHydratedVehicleCharacter,
  getInitialCurrentHpForVehicle,
  VehicleCharacterConflictError,
} from "@/app/lib/prisma/vehicleCharacter";
import { getCustomVehicle, getVehicle } from "@/app/lib/prisma/vehicle";
import { addVehicleToCharacterSchema } from "@/app/lib/types/vehicle";
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

    const { id: characterId } = (await params) as { id: string };
    if (!characterId || typeof characterId !== "string") {
      return errorResponse("Invalid character ID", 400);
    }

    if (!(await characterBelongsToUser(characterId, request.auth.user.id))) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const vehicles = await getCharacterVehicles(characterId);
    return NextResponse.json(vehicles);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/characters/[id]/vehicles",
      message: "Error retrieving character vehicles",
      error,
    });
    return errorResponse(
      "Error retrieving character vehicles",
      500,
      serializeError(error)
    );
  }
});

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    const { id: characterId } = (await params) as { id: string };
    if (!characterId || typeof characterId !== "string") {
      return errorResponse("Invalid character ID", 400);
    }

    if (!(await characterBelongsToUser(characterId, userId))) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const requestBody = await request.json();
    const parsed = addVehicleToCharacterSchema.safeParse(requestBody);
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const { sourceType, vehicleId } = parsed.data;

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
      if (
        !vehicle.gameId ||
        !(await characterIsInGame(vehicle.gameId, characterId))
      ) {
        return errorResponse(
          "That custom vehicle can only be added to a character in its game.",
          403
        );
      }
    }

    if (sourceType === "UNIQUE_VEHICLE") {
      const vehicle = await getUniqueVehicle(vehicleId);
      if (!vehicle) {
        return errorResponse("Unique vehicle not found", 404);
      }
      if (vehicle.ownerUserId !== userId) {
        return errorResponse("You can only add your own unique vehicles.", 403);
      }
      if (!(await characterIsInGame(vehicle.gameId, characterId))) {
        return errorResponse(
          "That unique vehicle can only be added to a character in its game.",
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
      route: "/api/characters/[id]/vehicles",
      message: "Error adding vehicle to character",
      error,
    });
    return errorResponse(
      "Error adding vehicle to character",
      500,
      serializeError(error)
    );
  }
});
