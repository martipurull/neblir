import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import {
  dismountVehicleForCharacter,
  mountVehicleForCharacter,
  VehicleCharacterConflictError,
} from "@/app/lib/prisma/vehicleCharacter";
import { activeVehiclePatchSchema } from "@/app/lib/types/vehicle";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { logger } from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

function getVehicleConflictStatus(
  error: VehicleCharacterConflictError
): number {
  if (
    error.message === "Character not found" ||
    error.message === "Vehicle not found for this character." ||
    error.message === "Active vehicle not found for this character."
  ) {
    return 404;
  }
  return 409;
}

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
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

    const parsed = activeVehiclePatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    if (parsed.data.action === "mount") {
      await mountVehicleForCharacter(
        characterId,
        parsed.data.vehicleCharacterId
      );
      return NextResponse.json({
        activeVehicleCharacterId: parsed.data.vehicleCharacterId,
      });
    }

    await dismountVehicleForCharacter(characterId, parsed.data.parkedAt);
    return NextResponse.json({
      activeVehicleCharacterId: null,
      parkedAt: parsed.data.parkedAt,
    });
  } catch (error) {
    if (error instanceof VehicleCharacterConflictError) {
      return errorResponse(error.message, getVehicleConflictStatus(error));
    }

    logger.error({
      method: "PATCH",
      route: "/api/characters/[id]/active-vehicle",
      message: "Error updating active vehicle",
      error,
    });
    return errorResponse(
      "Error updating active vehicle",
      500,
      serializeError(error)
    );
  }
});
