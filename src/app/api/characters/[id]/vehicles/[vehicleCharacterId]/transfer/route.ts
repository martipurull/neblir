import { prisma } from "@/app/lib/prisma/client";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import {
  performVehicleTransfer,
  validateVehicleTransferParties,
  VehicleTransferConflictError,
} from "@/app/lib/prisma/vehicleTransfer";
import { getCharacterVehicleRecord } from "@/app/lib/prisma/vehicleCharacter";
import { vehicleTransferSchema } from "@/app/lib/types/vehicle";
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

    const { id: fromCharacterId, vehicleCharacterId } = (await params) as {
      id: string;
      vehicleCharacterId: string;
    };
    if (
      !fromCharacterId ||
      typeof fromCharacterId !== "string" ||
      !vehicleCharacterId ||
      typeof vehicleCharacterId !== "string"
    ) {
      return errorResponse("Invalid character or vehicleCharacter ID", 400);
    }

    if (
      !(await characterBelongsToUser(fromCharacterId, request.auth.user.id))
    ) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const parsed = vehicleTransferSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const entry = await getCharacterVehicleRecord(
      fromCharacterId,
      vehicleCharacterId
    );
    if (!entry) {
      return errorResponse("Vehicle not found for this character", 404);
    }

    const fromCharacter = await prisma.character.findUnique({
      where: { id: fromCharacterId },
      select: { activeVehicleCharacterId: true },
    });
    if (fromCharacter?.activeVehicleCharacterId === vehicleCharacterId) {
      return errorResponse(
        "Dismount this vehicle before transferring it so its parked location can be recorded.",
        409
      );
    }

    const partyError = await validateVehicleTransferParties(
      fromCharacterId,
      parsed.data.toCharacterId,
      entry.sourceType,
      entry.vehicleId,
      request.auth.user.id
    );
    if (partyError) {
      return errorResponse(partyError.message, partyError.status);
    }

    try {
      await performVehicleTransfer({
        fromCharacterId,
        toCharacterId: parsed.data.toCharacterId,
        vehicleCharacterId,
      });
    } catch (error) {
      if (error instanceof VehicleTransferConflictError) {
        return errorResponse(error.message, 409);
      }
      throw error;
    }

    return NextResponse.json({ message: "Vehicle transferred" });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/characters/[id]/vehicles/[vehicleCharacterId]/transfer",
      message: "Error transferring vehicle",
      error,
    });
    return errorResponse(
      "Error transferring vehicle",
      500,
      serializeError(error)
    );
  }
});
