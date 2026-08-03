import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import {
  getCharacterVehicleRecord,
  getHydratedVehicleCharacter,
} from "@/app/lib/prisma/vehicleCharacter";
import {
  detachItemFromVehicle,
  VehicleMountedItemConflictError,
} from "@/app/lib/prisma/vehicleMountedItem";
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
      mountedItemId,
    } = (await params) as {
      id: string;
      vehicleCharacterId: string;
      mountedItemId: string;
    };

    if (
      !characterId ||
      typeof characterId !== "string" ||
      !vehicleCharacterId ||
      typeof vehicleCharacterId !== "string" ||
      !mountedItemId ||
      typeof mountedItemId !== "string"
    ) {
      return errorResponse(
        "Invalid character, vehicle, or mounted item ID",
        400
      );
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

    await detachItemFromVehicle({
      characterId,
      vehicleCharacterId,
      mountedItemId,
    });

    const hydratedVehicle =
      await getHydratedVehicleCharacter(vehicleCharacterId);
    return NextResponse.json({
      message: "Mounted item detached",
      vehicle: hydratedVehicle,
    });
  } catch (error) {
    if (error instanceof VehicleMountedItemConflictError) {
      const status = error.message.includes("not found") ? 404 : 409;
      return errorResponse(error.message, status);
    }

    logger.error({
      method: "DELETE",
      route:
        "/api/characters/[id]/vehicles/[vehicleCharacterId]/mounted-items/[mountedItemId]",
      message: "Error detaching mounted item",
      error,
    });
    return errorResponse(
      "Error detaching mounted item",
      500,
      serializeError(error)
    );
  }
});
