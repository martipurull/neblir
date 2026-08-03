import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import {
  getCharacterVehicleRecord,
  getHydratedVehicleCharacter,
  resolveVehicle,
} from "@/app/lib/prisma/vehicleCharacter";
import {
  addPassengerToVehicle,
  VehiclePassengerConflictError,
} from "@/app/lib/prisma/vehiclePassengers";
import { addVehiclePassengerSchema } from "@/app/lib/types/vehicle";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { logger } from "@/logger";
import { serializeError } from "../../../../../shared/errors";
import { errorResponse } from "../../../../../shared/responses";

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id: characterId, vehicleCharacterId } = (await params) as {
      id: string;
      vehicleCharacterId: string;
    };
    if (
      !characterId ||
      typeof characterId !== "string" ||
      !vehicleCharacterId ||
      typeof vehicleCharacterId !== "string"
    ) {
      return errorResponse("Invalid character or vehicleCharacter ID", 400);
    }

    if (!(await characterBelongsToUser(characterId, request.auth.user.id))) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const parsed = addVehiclePassengerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const vehicle = await getCharacterVehicleRecord(
      characterId,
      vehicleCharacterId
    );
    if (!vehicle) {
      return errorResponse("Vehicle not found for this character", 404);
    }

    const resolved = await resolveVehicle(
      vehicle.sourceType,
      vehicle.vehicleId
    );
    await addPassengerToVehicle({
      ownerCharacterId: characterId,
      vehicleCharacterId,
      passengerCharacterId: parsed.data.passengerCharacterId,
      maxPassengers: resolved?.maxPassengers ?? 1,
    });

    const hydrated = await getHydratedVehicleCharacter(vehicleCharacterId);
    return NextResponse.json({ vehicle: hydrated }, { status: 201 });
  } catch (error) {
    if (error instanceof VehiclePassengerConflictError) {
      const status = error.message.includes("not found") ? 404 : 409;
      return errorResponse(error.message, status);
    }
    logger.error({
      method: "POST",
      route: "/api/characters/[id]/vehicles/[vehicleCharacterId]/passengers",
      message: "Error adding vehicle passenger",
      error,
    });
    return errorResponse(
      "Error adding vehicle passenger",
      500,
      serializeError(error)
    );
  }
});
