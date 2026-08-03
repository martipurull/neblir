import { prisma } from "./client";
import {
  characterIsInGame,
  charactersShareAnyGame,
  viewerCanGiveItemToRecipient,
} from "./gameCharacter";
import type { VehicleSourceType } from "@/app/lib/types/vehicle";
import { returnAllVehicleCargoToCarried } from "./vehicleCargo";

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

  if (sourceType === "CUSTOM_VEHICLE") {
    const customVehicle = await prisma.customVehicle.findUnique({
      where: { id: vehicleId },
      select: { gameId: true },
    });
    if (!customVehicle) {
      return { message: "Custom vehicle not found", status: 404 };
    }

    const [fromInGame, toInGame] = await Promise.all([
      characterIsInGame(customVehicle.gameId, fromCharacterId),
      characterIsInGame(customVehicle.gameId, toCharacterId),
    ]);
    if (!fromInGame || !toInGame) {
      return {
        message:
          "That vehicle can only be given to another character in the same custom-vehicle game",
        status: 403,
      };
    }

    if (
      viewerUserId &&
      !(await viewerCanGiveItemToRecipient(
        viewerUserId,
        fromCharacterId,
        toCharacterId,
        { restrictGameId: customVehicle.gameId }
      ))
    ) {
      return {
        message: "You cannot give vehicles to that character",
        status: 403,
      };
    }

    return null;
  }

  if (sourceType === "UNIQUE_VEHICLE") {
    const uniqueVehicle = await prisma.uniqueVehicle.findUnique({
      where: { id: vehicleId },
      select: { gameId: true },
    });
    if (!uniqueVehicle) {
      return { message: "Unique vehicle not found", status: 404 };
    }

    const [fromInGame, toInGame] = await Promise.all([
      characterIsInGame(uniqueVehicle.gameId, fromCharacterId),
      characterIsInGame(uniqueVehicle.gameId, toCharacterId),
    ]);
    if (!fromInGame || !toInGame) {
      return {
        message:
          "That vehicle can only be given to another character registered for its game",
        status: 403,
      };
    }

    if (
      viewerUserId &&
      !(await viewerCanGiveItemToRecipient(
        viewerUserId,
        fromCharacterId,
        toCharacterId,
        { restrictGameId: uniqueVehicle.gameId }
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

  await returnAllVehicleCargoToCarried(row.id, args.fromCharacterId);

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

    // Mount links stay with the giver's inventory items; clear them on transfer.
    await tx.vehicleMountedItem.deleteMany({
      where: { vehicleCharacterId: row.id },
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
