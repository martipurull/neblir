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
  attachItemToVehicle,
  listMountedItemsForVehicle,
  VehicleMountedItemConflictError,
} from "@/app/lib/prisma/vehicleMountedItem";
import { attachVehicleMountedItemSchema } from "@/app/lib/types/vehicle";
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

export const GET = auth(async (request: AuthNextRequest, { params }) => {
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

    const vehicle = await getCharacterVehicleRecord(
      characterId,
      vehicleCharacterId
    );
    if (!vehicle) {
      return errorResponse("Vehicle not found for this character", 404);
    }

    const mountedItems = await listMountedItemsForVehicle(vehicleCharacterId);
    return NextResponse.json(mountedItems);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/characters/[id]/vehicles/[vehicleCharacterId]/mounted-items",
      message: "Error listing mounted items",
      error,
    });
    return errorResponse(
      "Error listing mounted items",
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

    const parsed = attachVehicleMountedItemSchema.safeParse(
      await request.json()
    );
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

    const resolvedVehicle = await resolveVehicle(
      vehicle.sourceType,
      vehicle.vehicleId
    );

    const itemBefore = await prisma.itemCharacter.findFirst({
      where: {
        id: parsed.data.itemCharacterId,
        characterId,
      },
      select: { isEquipped: true, equipSlots: true },
    });

    const mounted = await attachItemToVehicle({
      characterId,
      vehicleCharacterId,
      itemCharacterId: parsed.data.itemCharacterId,
      mountSlot: parsed.data.mountSlot,
      maxMountedItems: resolvedVehicle?.maxMountedItems ?? null,
    });

    const wasEquipped =
      itemBefore?.isEquipped === true ||
      (itemBefore?.equipSlots?.length ?? 0) > 0;
    if (wasEquipped) {
      await syncCombatForCharacter(characterId);
    }

    const hydratedVehicle =
      await getHydratedVehicleCharacter(vehicleCharacterId);
    return NextResponse.json(
      { mountedItem: mounted, vehicle: hydratedVehicle },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof VehicleMountedItemConflictError) {
      return errorResponse(error.message, error.status);
    }

    logger.error({
      method: "POST",
      route: "/api/characters/[id]/vehicles/[vehicleCharacterId]/mounted-items",
      message: "Error mounting item on vehicle",
      error,
    });
    return errorResponse(
      "Error mounting item on vehicle",
      500,
      serializeError(error)
    );
  }
});
