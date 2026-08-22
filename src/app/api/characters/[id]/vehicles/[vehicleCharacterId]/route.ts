import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import {
  canVehicleBeRidden,
  clearVehicleRiders,
  deleteVehicleCharacter,
  getCharacterVehicleRecord,
  getHydratedVehicleCharacter,
  updateVehicleCharacter,
} from "@/app/lib/prisma/vehicleCharacter";
import { vehicleCharacterPatchSchema } from "@/app/lib/types/vehicle";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { logger } from "@/logger";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
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

    const parsed = vehicleCharacterPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const existing = await getCharacterVehicleRecord(
      characterId,
      vehicleCharacterId
    );
    if (!existing) {
      return errorResponse("Vehicle not found for this character", 404);
    }

    const { action } = parsed.data;

    if (action === "adjustHp") {
      await updateVehicleCharacter(vehicleCharacterId, {
        currentHp: existing.currentHp + parsed.data.amount,
      });
    } else if (action === "setHp") {
      await updateVehicleCharacter(vehicleCharacterId, {
        currentHp: parsed.data.currentHp,
      });
    } else if (action === "setCustomName") {
      const customName = parsed.data.customName?.trim() ?? null;
      await updateVehicleCharacter(vehicleCharacterId, { customName });
    } else if (action === "setParkedAt") {
      await updateVehicleCharacter(vehicleCharacterId, {
        parkedAt: parsed.data.parkedAt,
      });
    } else if (action === "setNotes") {
      const notes = parsed.data.notes?.trim() ?? null;
      await updateVehicleCharacter(vehicleCharacterId, { notes });
    } else if (action === "setMaxHpBonus") {
      await updateVehicleCharacter(vehicleCharacterId, {
        maxHpBonus: parsed.data.maxHpBonus,
      });
    } else {
      await updateVehicleCharacter(vehicleCharacterId, {
        isBeyondRepair: parsed.data.isBeyondRepair,
      });
    }

    const updated = await getCharacterVehicleRecord(
      characterId,
      vehicleCharacterId
    );
    if (!updated) {
      return errorResponse("Vehicle not found for this character", 404);
    }

    if (!canVehicleBeRidden(updated)) {
      await clearVehicleRiders(vehicleCharacterId);
    }

    const hydrated = await getHydratedVehicleCharacter(vehicleCharacterId);
    return NextResponse.json(hydrated ?? updated);
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/characters/[id]/vehicles/[vehicleCharacterId]",
      message: "Error updating character vehicle",
      error,
    });
    return errorResponse(
      "Error updating character vehicle",
      500,
      serializeError(error)
    );
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
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

    const existing = await getCharacterVehicleRecord(
      characterId,
      vehicleCharacterId
    );
    if (!existing) {
      return errorResponse("Vehicle not found for this character", 404);
    }

    await clearVehicleRiders(vehicleCharacterId);
    await deleteVehicleCharacter(vehicleCharacterId);
    return new Response(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/characters/[id]/vehicles/[vehicleCharacterId]",
      message: "Error deleting character vehicle",
      error,
    });
    return errorResponse(
      "Error deleting character vehicle",
      500,
      serializeError(error)
    );
  }
});
