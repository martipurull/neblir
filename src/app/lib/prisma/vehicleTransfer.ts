import { vehicleCargoItemLocation } from "@/app/lib/constants/inventory";
import type { VehicleSourceType } from "@/app/lib/types/vehicle";
import { prisma } from "./client";
import {
  characterIsInGame,
  charactersShareAnyGame,
  viewerCanGiveItemToRecipient,
} from "./gameCharacter";

export class VehicleTransferConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VehicleTransferConflictError";
  }
}

export async function validateVehicleTransferParties(
  fromCharacterId: string,
  toCharacterId: string,
  sourceType: VehicleSourceType,
  vehicleId: string,
  viewerUserId?: string
): Promise<{ message: string; status: number } | null> {
  if (fromCharacterId === toCharacterId) {
    return {
      message: "Cannot give a vehicle to the same character",
      status: 400,
    };
  }

  const recipientExists = await prisma.character.findUnique({
    where: { id: toCharacterId },
    select: { id: true },
  });
  if (!recipientExists) {
    return { message: "Recipient character not found", status: 404 };
  }

  if (sourceType === "CUSTOM_VEHICLE" || sourceType === "UNIQUE_VEHICLE") {
    const template =
      sourceType === "CUSTOM_VEHICLE"
        ? await prisma.customVehicle.findUnique({
            where: { id: vehicleId },
            select: { gameId: true },
          })
        : await prisma.uniqueVehicle.findUnique({
            where: { id: vehicleId },
            select: { gameId: true },
          });
    if (!template) {
      return {
        message:
          sourceType === "CUSTOM_VEHICLE"
            ? "Custom vehicle not found"
            : "Unique vehicle not found",
        status: 404,
      };
    }

    const [fromInGame, toInGame] = await Promise.all([
      characterIsInGame(template.gameId, fromCharacterId),
      characterIsInGame(template.gameId, toCharacterId),
    ]);
    if (!fromInGame || !toInGame) {
      return {
        message:
          sourceType === "CUSTOM_VEHICLE"
            ? "That vehicle can only be given to another character in the same custom-vehicle game"
            : "That vehicle can only be given to another character registered for its game",
        status: 403,
      };
    }

    if (
      viewerUserId &&
      !(await viewerCanGiveItemToRecipient(
        viewerUserId,
        fromCharacterId,
        toCharacterId,
        { restrictGameId: template.gameId }
      ))
    ) {
      return {
        message: "You cannot give vehicles to that character",
        status: 403,
      };
    }

    return null;
  }

  const sharedGame = await charactersShareAnyGame(
    fromCharacterId,
    toCharacterId
  );
  if (!sharedGame) {
    return {
      message:
        "Recipient must be in a game that this character is registered for",
      status: 403,
    };
  }

  if (
    viewerUserId &&
    !(await viewerCanGiveItemToRecipient(
      viewerUserId,
      fromCharacterId,
      toCharacterId
    ))
  ) {
    return {
      message: "You cannot give vehicles to that character",
      status: 403,
    };
  }

  return null;
}

export async function performVehicleTransfer(args: {
  fromCharacterId: string;
  toCharacterId: string;
  vehicleCharacterId: string;
}): Promise<void> {
  const row = await prisma.vehicleCharacter.findFirst({
    where: {
      id: args.vehicleCharacterId,
      characterId: args.fromCharacterId,
    },
  });

  if (!row) {
    throw new VehicleTransferConflictError(
      "Vehicle is no longer owned by this character"
    );
  }

  const passengerIds = row.passengerCharacterIds ?? [];
  const cargoLocation = vehicleCargoItemLocation(row.id);

  await prisma.$transaction(async (tx) => {
    for (const passengerId of passengerIds) {
      const passenger = await tx.character.findUnique({
        where: { id: passengerId },
        select: { activeVehicleCharacterId: true },
      });
      if (passenger?.activeVehicleCharacterId === row.id) {
        await tx.character.update({
          where: { id: passengerId },
          data: { activeVehicleCharacterId: null },
        });
      }
    }

    // Mounted items stay linked to the vehicle; ownership moves with the giver.
    const mounts = await tx.vehicleMountedItem.findMany({
      where: { vehicleCharacterId: row.id },
      select: { itemCharacterId: true },
    });
    if (mounts.length > 0) {
      await tx.itemCharacter.updateMany({
        where: {
          id: { in: mounts.map((m) => m.itemCharacterId) },
          characterId: args.fromCharacterId,
        },
        data: {
          characterId: args.toCharacterId,
          isEquipped: false,
          equipSlots: [],
        },
      });
    }

    // Cargo stays in the vehicle; ownership moves to the recipient.
    await tx.itemCharacter.updateMany({
      where: {
        characterId: args.fromCharacterId,
        itemLocation: cargoLocation,
      },
      data: {
        characterId: args.toCharacterId,
        isEquipped: false,
        equipSlots: [],
      },
    });

    await tx.vehicleCharacter.update({
      where: { id: row.id },
      data: {
        characterId: args.toCharacterId,
        passengerCharacterIds: [],
        parkedAt: row.parkedAt,
      },
    });

    const fromCharacter = await tx.character.findUnique({
      where: { id: args.fromCharacterId },
      select: { activeVehicleCharacterId: true },
    });
    if (fromCharacter?.activeVehicleCharacterId === row.id) {
      await tx.character.update({
        where: { id: args.fromCharacterId },
        data: { activeVehicleCharacterId: null },
      });
    }
  });
}
