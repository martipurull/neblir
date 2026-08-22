import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import {
  getCharacterVehicleRecord,
  getHydratedVehicleCharacter,
} from "@/app/lib/prisma/vehicleCharacter";
import {
  retrieveItemFromVehicleCargo,
  VehicleCargoConflictError,
} from "@/app/lib/prisma/vehicleCargo";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { logger } from "@/logger";
import { serializeError } from "../../../../../../shared/errors";
import { errorResponse } from "../../../../../../shared/responses";

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const {
      id: characterId,
      vehicleCharacterId,
      itemCharacterId,
    } = (await params) as {
      id: string;
      vehicleCharacterId: string;
      itemCharacterId: string;
    };

    if (
      !characterId ||
      typeof characterId !== "string" ||
      !vehicleCharacterId ||
      typeof vehicleCharacterId !== "string" ||
      !itemCharacterId ||
      typeof itemCharacterId !== "string"
    ) {
      return errorResponse("Invalid character, vehicle, or item ID", 400);
    }

    if (!(await characterBelongsToUser(characterId, request.auth.user.id))) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const vehicle = await getCharacterVehicleRecord(
      characterId,
      vehicleCharacterId
    );
    if (!vehicle) {
      return errorResponse("Vehicle not found for this character", 404);
    }

    await retrieveItemFromVehicleCargo({
      ownerCharacterId: characterId,
      vehicleCharacterId,
      itemCharacterId,
    });

    const hydrated = await getHydratedVehicleCharacter(vehicleCharacterId);
    return NextResponse.json({
      message: "Cargo retrieved",
      vehicle: hydrated,
    });
  } catch (error) {
    if (error instanceof VehicleCargoConflictError) {
      return errorResponse(error.message, error.status);
    }
    logger.error({
      method: "DELETE",
      route:
        "/api/characters/[id]/vehicles/[vehicleCharacterId]/cargo/[itemCharacterId]",
      message: "Error retrieving vehicle cargo",
      error,
    });
    return errorResponse(
      "Error retrieving vehicle cargo",
      500,
      serializeError(error)
    );
  }
});
