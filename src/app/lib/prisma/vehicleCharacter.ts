import type {
  ResolvedVehicle,
  VehicleCargoItem,
  VehicleCharacter,
  VehicleDerivedStatus,
  VehicleMountedItem,
  VehiclePassenger,
  VehicleSourceType,
} from "@/app/lib/types/vehicle";
import {
  ITEM_LOCATION_CARRIED,
  vehicleCargoItemLocation,
  vehicleMountedItemLocation,
} from "@/app/lib/constants/inventory";
import { prisma } from "./client";
import { resolveUniqueVehicle } from "./uniqueVehicle";
import { getCustomVehicle, getVehicle } from "./vehicle";
import { listCargoForVehicles } from "./vehicleCargo";
import { listMountedItemsForVehicles } from "./vehicleMountedItem";
import {
  getVehicleOccupantCount,
  hydrateVehiclePassengers,
  isDriverPresentOnVehicle,
} from "./vehiclePassengers";

type VehicleCharacterCreateData = {
  characterId: string;
  sourceType: VehicleSourceType;
  vehicleId: string;
  customName?: string | null;
  currentHp: number;
  maxHpBonus?: number;
  isBeyondRepair?: boolean;
  parkedAt?: string | null;
  notes?: string | null;
  passengerCharacterIds?: string[];
};

type VehicleCharacterUpdateData = Partial<VehicleCharacterCreateData>;

type VehicleCharacterRow = {
  id: string;
  characterId: string;
  sourceType: VehicleSourceType;
  vehicleId: string;
  customName: string | null;
  currentHp: number;
  maxHpBonus: number;
  isBeyondRepair: boolean;
  parkedAt: string | null;
  notes: string | null;
  passengerCharacterIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

const vehicleCharacterPrisma = prisma as typeof prisma & {
  vehicleCharacter: {
    findFirst(args: {
      where: {
        id?: string;
        characterId?: string;
        sourceType?: VehicleSourceType;
        vehicleId?: string;
      };
    }): Promise<VehicleCharacterRow | null>;
    findUnique(args: {
      where: { id: string };
    }): Promise<VehicleCharacterRow | null>;
    findMany(args: {
      where:
        | { characterId: string }
        | { sourceType: VehicleSourceType; vehicleId: string };
    }): Promise<VehicleCharacterRow[]>;
    create(args: {
      data: VehicleCharacterCreateData;
    }): Promise<VehicleCharacterRow>;
    update(args: {
      where: { id: string };
      data: VehicleCharacterUpdateData;
    }): Promise<VehicleCharacterRow>;
    delete(args: { where: { id: string } }): Promise<VehicleCharacterRow>;
  };
};

export class VehicleCharacterConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VehicleCharacterConflictError";
  }
}

export async function resolveVehicle(
  sourceType: VehicleSourceType,
  vehicleId: string
): Promise<ResolvedVehicle | null> {
  switch (sourceType) {
    case "GLOBAL_VEHICLE":
      return getVehicle(vehicleId);
    case "CUSTOM_VEHICLE":
      return getCustomVehicle(vehicleId);
    case "UNIQUE_VEHICLE":
      return resolveUniqueVehicle(vehicleId);
    default:
      return null;
  }
}

export async function getInitialCurrentHpForVehicle(
  sourceType: VehicleSourceType,
  vehicleId: string
): Promise<number> {
  const vehicle = await resolveVehicle(sourceType, vehicleId);
  return vehicle?.maxHp ?? 0;
}

export function getEffectiveVehicleMaxHp(entry: {
  maxHpBonus?: number | null;
  vehicle?: { maxHp?: number | null } | null;
}): number | null {
  const baseMaxHp = entry.vehicle?.maxHp;
  if (baseMaxHp == null) return null;
  return baseMaxHp + (entry.maxHpBonus ?? 0);
}

export function getDerivedVehicleStatus(entry: {
  currentHp: number;
  isBeyondRepair?: boolean | null;
}): VehicleDerivedStatus {
  if (entry.isBeyondRepair) return "BEYOND_REPAIR";
  if (entry.currentHp <= 0) return "BROKEN_DOWN";
  return "OPERATIONAL";
}

export function canVehicleBeRidden(entry: {
  currentHp: number;
  isBeyondRepair?: boolean | null;
}): boolean {
  return getDerivedVehicleStatus(entry) === "OPERATIONAL";
}

export async function createVehicleCharacter(
  characterId: string,
  sourceType: VehicleSourceType,
  vehicleId: string,
  options?: {
    currentHp?: number;
    customName?: string | null;
    maxHpBonus?: number;
    isBeyondRepair?: boolean;
    parkedAt?: string | null;
    notes?: string | null;
  }
) {
  if (sourceType === "UNIQUE_VEHICLE") {
    const existing = await vehicleCharacterPrisma.vehicleCharacter.findFirst({
      where: { sourceType, vehicleId },
    });
    if (existing) {
      throw new VehicleCharacterConflictError(
        "This unique vehicle is already owned by a character."
      );
    }
  }

  return vehicleCharacterPrisma.vehicleCharacter.create({
    data: {
      characterId,
      sourceType,
      vehicleId,
      currentHp: options?.currentHp ?? 0,
      ...(options?.customName !== undefined
        ? { customName: options.customName }
        : {}),
      ...(options?.maxHpBonus !== undefined
        ? { maxHpBonus: options.maxHpBonus }
        : {}),
      ...(options?.isBeyondRepair !== undefined
        ? { isBeyondRepair: options.isBeyondRepair }
        : {}),
      ...(options?.parkedAt !== undefined
        ? { parkedAt: options.parkedAt }
        : {}),
      ...(options?.notes !== undefined ? { notes: options.notes } : {}),
    },
  });
}

async function getVehicleCharacter(id: string) {
  return vehicleCharacterPrisma.vehicleCharacter.findUnique({ where: { id } });
}

export async function getCharacterVehicleRecord(
  characterId: string,
  vehicleCharacterId: string
) {
  return vehicleCharacterPrisma.vehicleCharacter.findFirst({
    where: { id: vehicleCharacterId, characterId },
  });
}

export async function updateVehicleCharacter(
  id: string,
  data: VehicleCharacterUpdateData
) {
  return vehicleCharacterPrisma.vehicleCharacter.update({
    where: { id },
    data,
  });
}

export async function deleteVehicleCharacter(id: string) {
  const row = await vehicleCharacterPrisma.vehicleCharacter.findUnique({
    where: { id },
    select: { id: true, characterId: true },
  });
  if (!row) {
    return vehicleCharacterPrisma.vehicleCharacter.delete({ where: { id } });
  }

  const cargoLocation = vehicleCargoItemLocation(id);
  const mountedLocation = vehicleMountedItemLocation(id);

  return prisma.$transaction(async (tx) => {
    await tx.itemCharacter.updateMany({
      where: {
        OR: [
          { itemLocation: mountedLocation },
          {
            characterId: row.characterId,
            itemLocation: cargoLocation,
          },
        ],
      },
      data: {
        itemLocation: ITEM_LOCATION_CARRIED,
        isEquipped: false,
        equipSlots: [],
      },
    });

    return tx.vehicleCharacter.delete({ where: { id } });
  });
}

async function hydrateVehicleCharacter(
  record: VehicleCharacterRow,
  extras?: {
    mountedItems?: VehicleMountedItem[];
    cargoItems?: VehicleCargoItem[];
    cargoWeightKg?: number;
    passengers?: VehiclePassenger[];
    driverPresent?: boolean;
  }
): Promise<VehicleCharacter> {
  const vehicle = await resolveVehicle(record.sourceType, record.vehicleId);
  const passengerCharacterIds = record.passengerCharacterIds ?? [];
  const driverPresent =
    extras?.driverPresent ??
    (await isDriverPresentOnVehicle(record.id, record.characterId));
  const passengers =
    extras?.passengers ??
    (await hydrateVehiclePassengers(passengerCharacterIds));
  const { occupantCount } = getVehicleOccupantCount({
    maxPassengers: vehicle?.maxPassengers ?? passengerCharacterIds.length + 1,
    driverPresent,
    passengerCharacterIds,
  });

  return {
    ...record,
    passengerCharacterIds,
    vehicle,
    effectiveMaxHp: getEffectiveVehicleMaxHp({
      maxHpBonus: record.maxHpBonus,
      vehicle,
    }),
    derivedStatus: getDerivedVehicleStatus(record),
    canBeRidden: canVehicleBeRidden(record),
    mountedItems: extras?.mountedItems ?? [],
    cargoItems: extras?.cargoItems ?? [],
    cargoWeightKg: extras?.cargoWeightKg ?? 0,
    passengers,
    occupantCount,
    driverPresent,
  };
}

export async function getHydratedVehicleCharacter(id: string) {
  const record = await getVehicleCharacter(id);
  if (!record) return null;
  const [mountedByVehicle, cargoByVehicle] = await Promise.all([
    listMountedItemsForVehicles([record.id]),
    listCargoForVehicles([{ id: record.id, characterId: record.characterId }]),
  ]);
  const cargo = cargoByVehicle.get(record.id) ?? {
    cargoItems: [],
    cargoWeightKg: 0,
  };
  return hydrateVehicleCharacter(record, {
    mountedItems: mountedByVehicle.get(record.id) ?? [],
    cargoItems: cargo.cargoItems,
    cargoWeightKg: cargo.cargoWeightKg,
  });
}

export async function getCharacterVehicles(characterId: string) {
  const records = await vehicleCharacterPrisma.vehicleCharacter.findMany({
    where: { characterId },
  });
  return hydrateVehicleCharacters(records);
}

export async function hydrateVehicleCharacters(records: VehicleCharacterRow[]) {
  if (records.length === 0) return [];
  const [mountedByVehicle, cargoByVehicle, ownerActiveVehicles] =
    await Promise.all([
      listMountedItemsForVehicles(records.map((record) => record.id)),
      listCargoForVehicles(
        records.map((record) => ({
          id: record.id,
          characterId: record.characterId,
        }))
      ),
      prisma.character.findMany({
        where: { id: { in: [...new Set(records.map((r) => r.characterId))] } },
        select: { id: true, activeVehicleCharacterId: true },
      }),
    ]);
  const activeByOwner = new Map(
    ownerActiveVehicles.map((row) => [row.id, row.activeVehicleCharacterId])
  );

  return Promise.all(
    records.map(async (record) => {
      const cargo = cargoByVehicle.get(record.id) ?? {
        cargoItems: [],
        cargoWeightKg: 0,
      };
      return hydrateVehicleCharacter(record, {
        mountedItems: mountedByVehicle.get(record.id) ?? [],
        cargoItems: cargo.cargoItems,
        cargoWeightKg: cargo.cargoWeightKg,
        driverPresent: activeByOwner.get(record.characterId) === record.id,
      });
    })
  );
}

export async function clearVehicleRiders(
  vehicleCharacterId: string,
  options?: { parkedAt?: string }
) {
  const vehicle = await vehicleCharacterPrisma.vehicleCharacter.findUnique({
    where: { id: vehicleCharacterId },
  });
  if (!vehicle) return;

  const passengerIds = vehicle.passengerCharacterIds ?? [];
  await prisma.$transaction(async (tx) => {
    for (const passengerId of passengerIds) {
      const passenger = await tx.character.findUnique({
        where: { id: passengerId },
        select: { activeVehicleCharacterId: true },
      });
      if (passenger?.activeVehicleCharacterId === vehicleCharacterId) {
        await tx.character.update({
          where: { id: passengerId },
          data: { activeVehicleCharacterId: null },
        });
      }
    }

    const owner = await tx.character.findUnique({
      where: { id: vehicle.characterId },
      select: { activeVehicleCharacterId: true },
    });
    if (owner?.activeVehicleCharacterId === vehicleCharacterId) {
      await tx.character.update({
        where: { id: vehicle.characterId },
        data: { activeVehicleCharacterId: null },
      });
    }

    await tx.vehicleCharacter.update({
      where: { id: vehicleCharacterId },
      data: {
        passengerCharacterIds: [],
        ...(options?.parkedAt !== undefined
          ? { parkedAt: options.parkedAt }
          : {}),
      },
    });
  });
}

export async function deleteLiveInstancesForUniqueVehicle(
  uniqueVehicleId: string
) {
  const rows = await vehicleCharacterPrisma.vehicleCharacter.findMany({
    where: { sourceType: "UNIQUE_VEHICLE", vehicleId: uniqueVehicleId },
  });
  for (const row of rows) {
    await clearVehicleRiders(row.id);
    await deleteVehicleCharacter(row.id);
  }
}

export async function mountVehicleForCharacter(
  characterId: string,
  vehicleCharacterId: string
) {
  await prisma.$transaction(async (tx) => {
    const character = await tx.character.findUnique({
      where: { id: characterId },
      select: { activeVehicleCharacterId: true },
    });
    if (!character) {
      throw new VehicleCharacterConflictError("Character not found");
    }
    if (
      character.activeVehicleCharacterId &&
      character.activeVehicleCharacterId !== vehicleCharacterId
    ) {
      throw new VehicleCharacterConflictError(
        "Dismount the current vehicle before mounting another one."
      );
    }

    const vehicle = await tx.vehicleCharacter.findFirst({
      where: { id: vehicleCharacterId, characterId },
    });
    if (!vehicle) {
      throw new VehicleCharacterConflictError(
        "Vehicle not found for this character."
      );
    }
    if (!canVehicleBeRidden(vehicle)) {
      throw new VehicleCharacterConflictError(
        "Broken-down or beyond-repair vehicles cannot be mounted."
      );
    }

    const resolved = await resolveVehicle(
      vehicle.sourceType,
      vehicle.vehicleId
    );
    const maxPassengers = resolved?.maxPassengers ?? 1;
    const passengerIds = vehicle.passengerCharacterIds ?? [];
    // Driver seat is about to be taken; ensure capacity still holds.
    const { occupantCount } = getVehicleOccupantCount({
      maxPassengers,
      driverPresent: true,
      passengerCharacterIds: passengerIds,
    });
    if (occupantCount > maxPassengers) {
      throw new VehicleCharacterConflictError(
        `This vehicle is at capacity (${maxPassengers} including the driver). Remove a passenger first.`
      );
    }

    await tx.vehicleCharacter.update({
      where: { id: vehicleCharacterId },
      data: { parkedAt: null },
    });
    await tx.character.update({
      where: { id: characterId },
      data: { activeVehicleCharacterId: vehicleCharacterId },
    });
  });
}

export async function dismountVehicleForCharacter(
  characterId: string,
  parkedAt: string
) {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { activeVehicleCharacterId: true },
  });
  if (!character) {
    throw new VehicleCharacterConflictError("Character not found");
  }
  if (!character.activeVehicleCharacterId) {
    throw new VehicleCharacterConflictError(
      "Character is not riding a vehicle."
    );
  }

  const activeVehicleId = character.activeVehicleCharacterId;
  const ownedVehicle = await prisma.vehicleCharacter.findFirst({
    where: { id: activeVehicleId, characterId },
  });

  if (ownedVehicle) {
    await clearVehicleRiders(ownedVehicle.id, { parkedAt });
    return;
  }

  // Passenger dismount: leave someone else's vehicle.
  const hostVehicle = await prisma.vehicleCharacter.findUnique({
    where: { id: activeVehicleId },
  });
  if (!hostVehicle) {
    await prisma.character.update({
      where: { id: characterId },
      data: { activeVehicleCharacterId: null },
    });
    throw new VehicleCharacterConflictError(
      "Active vehicle not found for this character."
    );
  }

  const passengerIds = hostVehicle.passengerCharacterIds ?? [];
  if (!passengerIds.includes(characterId)) {
    await prisma.character.update({
      where: { id: characterId },
      data: { activeVehicleCharacterId: null },
    });
    throw new VehicleCharacterConflictError(
      "Active vehicle not found for this character."
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.vehicleCharacter.update({
      where: { id: hostVehicle.id },
      data: {
        passengerCharacterIds: passengerIds.filter((id) => id !== characterId),
      },
    });
    await tx.character.update({
      where: { id: characterId },
      data: { activeVehicleCharacterId: null },
    });
  });
}
