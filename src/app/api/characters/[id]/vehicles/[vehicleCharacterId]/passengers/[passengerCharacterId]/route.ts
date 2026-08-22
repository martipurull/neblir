import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import {
  getCharacterVehicleRecord,
  getHydratedVehicleCharacter,
} from "@/app/lib/prisma/vehicleCharacter";
import {
  removePassengerFromVehicle,
  VehiclePassengerConflictError,
} from "@/app/lib/prisma/vehiclePassengers";
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
      passengerCharacterId,
    } = (await params) as {
      id: string;
      vehicleCharacterId: string;
      passengerCharacterId: string;
    };

    if (
      !characterId ||
      typeof characterId !== "string" ||
      !vehicleCharacterId ||
      typeof vehicleCharacterId !== "string" ||
      !passengerCharacterId ||
      typeof passengerCharacterId !== "string"
    ) {
      return errorResponse("Invalid character, vehicle, or passenger ID", 400);
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

    await removePassengerFromVehicle({
      ownerCharacterId: characterId,
      vehicleCharacterId,
      passengerCharacterId,
    });

    const hydrated = await getHydratedVehicleCharacter(vehicleCharacterId);
    return NextResponse.json({
      message: "Passenger removed",
      vehicle: hydrated,
    });
  } catch (error) {
    if (error instanceof VehiclePassengerConflictError) {
      return errorResponse(error.message, error.status);
    }
    logger.error({
      method: "DELETE",
      route:
        "/api/characters/[id]/vehicles/[vehicleCharacterId]/passengers/[passengerCharacterId]",
      message: "Error removing vehicle passenger",
      error,
    });
    return errorResponse(
      "Error removing vehicle passenger",
      500,
      serializeError(error)
    );
  }
});
