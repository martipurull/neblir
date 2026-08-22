import type { VehiclePassenger } from "@/app/lib/types/vehicle";
import { prisma } from "./client";
import { charactersShareAnyGame } from "./gameCharacter";
import { VehicleDomainError } from "./vehicleDomainError";

export class VehiclePassengerConflictError extends VehicleDomainError {
  constructor(message: string, status: 404 | 409 = 409) {
    super(message, status);
    this.name = "VehiclePassengerConflictError";
  }
}

function vehicleCanTakePassengers(vehicle: {
  currentHp: number;
  isBeyondRepair?: boolean | null;
}): boolean {
  if (vehicle.isBeyondRepair) return false;
  return vehicle.currentHp > 0;
}

export function getVehicleOccupantCount(args: {
  maxPassengers: number;
  driverPresent: boolean;
  passengerCharacterIds: string[];
}): {
  occupantCount: number;
  remainingSeats: number;
} {
  const occupantCount =
    (args.driverPresent ? 1 : 0) + args.passengerCharacterIds.length;
  const remainingSeats = Math.max(
    0,
    args.maxPassengers - 1 - args.passengerCharacterIds.length
  );
  return {
    occupantCount,
    remainingSeats,
  };
}

export async function isDriverPresentOnVehicle(
  vehicleCharacterId: string,
  ownerCharacterId: string
): Promise<boolean> {
  const owner = await prisma.character.findUnique({
    where: { id: ownerCharacterId },
    select: { activeVehicleCharacterId: true },
  });
  return owner?.activeVehicleCharacterId === vehicleCharacterId;
}

export async function hydrateVehiclePassengers(
  passengerCharacterIds: string[]
): Promise<VehiclePassenger[]> {
  if (passengerCharacterIds.length === 0) return [];
  const characters = await prisma.character.findMany({
    where: { id: { in: passengerCharacterIds } },
    select: {
      id: true,
      generalInformation: {
        select: { name: true, surname: true },
      },
    },
  });
  const byId = new Map(characters.map((c) => [c.id, c]));
  return passengerCharacterIds.flatMap((id) => {
    const row = byId.get(id);
    if (!row) return [];
    return [
      {
        characterId: row.id,
        name: row.generalInformation.name,
        surname: row.generalInformation.surname,
      },
    ];
  });
}

export async function addPassengerToVehicle(args: {
  ownerCharacterId: string;
  vehicleCharacterId: string;
  passengerCharacterId: string;
  maxPassengers: number;
}): Promise<void> {
  if (args.passengerCharacterId === args.ownerCharacterId) {
    throw new VehiclePassengerConflictError(
      "The vehicle owner rides as the driver, not as a passenger"
    );
  }

  const vehicle = await prisma.vehicleCharacter.findFirst({
    where: {
      id: args.vehicleCharacterId,
      characterId: args.ownerCharacterId,
    },
  });
  if (!vehicle) {
    throw new VehiclePassengerConflictError(
      "Vehicle not found for this character",
      404
    );
  }
  if (!vehicleCanTakePassengers(vehicle)) {
    throw new VehiclePassengerConflictError(
      "Broken-down or beyond-repair vehicles cannot take passengers"
    );
  }

  const passengerIds = vehicle.passengerCharacterIds ?? [];
  if (passengerIds.includes(args.passengerCharacterId)) {
    throw new VehiclePassengerConflictError(
      "That character is already a passenger on this vehicle"
    );
  }

  const share = await charactersShareAnyGame(
    args.ownerCharacterId,
    args.passengerCharacterId
  );
  if (!share) {
    throw new VehiclePassengerConflictError(
      "Passenger must share a game with the vehicle owner"
    );
  }

  const passenger = await prisma.character.findUnique({
    where: { id: args.passengerCharacterId },
    select: { id: true, activeVehicleCharacterId: true },
  });
  if (!passenger) {
    throw new VehiclePassengerConflictError(
      "Passenger character not found",
      404
    );
  }
  if (
    passenger.activeVehicleCharacterId &&
    passenger.activeVehicleCharacterId !== args.vehicleCharacterId
  ) {
    throw new VehiclePassengerConflictError(
      "Passenger must dismount their current vehicle first"
    );
  }

  const driverPresent = await isDriverPresentOnVehicle(
    args.vehicleCharacterId,
    args.ownerCharacterId
  );
  if (!driverPresent) {
    throw new VehiclePassengerConflictError(
      "Passengers can only board while the owner is driving"
    );
  }
  const { remainingSeats } = getVehicleOccupantCount({
    maxPassengers: args.maxPassengers,
    driverPresent,
    passengerCharacterIds: passengerIds,
  });
  if (remainingSeats <= 0) {
    throw new VehiclePassengerConflictError(
      `This vehicle is at passenger capacity (${args.maxPassengers} including the driver)`
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.vehicleCharacter.update({
      where: { id: args.vehicleCharacterId },
      data: {
        passengerCharacterIds: [...passengerIds, args.passengerCharacterId],
      },
    });
    await tx.character.update({
      where: { id: args.passengerCharacterId },
      data: { activeVehicleCharacterId: args.vehicleCharacterId },
    });
  });
}

export async function removePassengerFromVehicle(args: {
  ownerCharacterId: string;
  vehicleCharacterId: string;
  passengerCharacterId: string;
}): Promise<void> {
  const vehicle = await prisma.vehicleCharacter.findFirst({
    where: {
      id: args.vehicleCharacterId,
      characterId: args.ownerCharacterId,
    },
  });
  if (!vehicle) {
    throw new VehiclePassengerConflictError(
      "Vehicle not found for this character",
      404
    );
  }

  const passengerIds = vehicle.passengerCharacterIds ?? [];
  if (!passengerIds.includes(args.passengerCharacterId)) {
    throw new VehiclePassengerConflictError(
      "That character is not a passenger on this vehicle"
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.vehicleCharacter.update({
      where: { id: args.vehicleCharacterId },
      data: {
        passengerCharacterIds: passengerIds.filter(
          (id) => id !== args.passengerCharacterId
        ),
      },
    });
    const passenger = await tx.character.findUnique({
      where: { id: args.passengerCharacterId },
      select: { activeVehicleCharacterId: true },
    });
    if (passenger?.activeVehicleCharacterId === args.vehicleCharacterId) {
      await tx.character.update({
        where: { id: args.passengerCharacterId },
        data: { activeVehicleCharacterId: null },
      });
    }
  });
}
