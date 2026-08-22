import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import { prisma } from "@/app/lib/prisma/client";
import {
  type CharacterForCombatSync,
  computeCombatInfoUpdateForCharacter,
} from "@/app/lib/equipCombatUtils";
import {
  getCharacterVehicleRecord,
  getHydratedVehicleCharacter,
  resolveVehicle,
} from "@/app/lib/prisma/vehicleCharacter";
import {
  stowItemAsVehicleCargo,
  VehicleCargoConflictError,
} from "@/app/lib/prisma/vehicleCargo";
import { stowVehicleCargoSchema } from "@/app/lib/types/vehicle";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { logger } from "@/logger";
import { serializeError } from "../../../../../shared/errors";
import { errorResponse } from "../../../../../shared/responses";

async function syncCombatForCharacter(characterId: string) {
  const character = await getCharacter(characterId);
  if (character?.combatInformation) {
    const combatUpdate = computeCombatInfoUpdateForCharacter(
      character as CharacterForCombatSync
    );
    await updateCharacter(characterId, {
      combatInformation: {
        ...character.combatInformation,
        ...combatUpdate,
      },
    });
  }
}

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

    const parsed = stowVehicleCargoSchema.safeParse(await request.json());
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
    const itemBefore = await prisma.itemCharacter.findFirst({
      where: { id: parsed.data.itemCharacterId, characterId },
      select: { isEquipped: true, equipSlots: true },
    });

    await stowItemAsVehicleCargo({
      ownerCharacterId: characterId,
      vehicleCharacterId,
      itemCharacterId: parsed.data.itemCharacterId,
      maxCargoWeightKg: resolved?.maxCargoWeightKg,
    });

    const wasEquipped =
      itemBefore?.isEquipped === true ||
      (itemBefore?.equipSlots?.length ?? 0) > 0;
    if (wasEquipped) {
      await syncCombatForCharacter(characterId);
    }

    const hydrated = await getHydratedVehicleCharacter(vehicleCharacterId);
    return NextResponse.json({ vehicle: hydrated }, { status: 201 });
  } catch (error) {
    if (error instanceof VehicleCargoConflictError) {
      return errorResponse(error.message, error.status);
    }
    logger.error({
      method: "POST",
      route: "/api/characters/[id]/vehicles/[vehicleCharacterId]/cargo",
      message: "Error stowing vehicle cargo",
      error,
    });
    return errorResponse(
      "Error stowing vehicle cargo",
      500,
      serializeError(error)
    );
  }
});
