import {
  ITEM_LOCATION_CARRIED,
  vehicleCargoItemLocation,
} from "@/app/lib/constants/inventory";
import { getInventoryEntryCarriedWeight } from "@/app/lib/carryWeightUtils";
import type { VehicleCargoItem } from "@/app/lib/types/vehicle";
import { prisma } from "./client";
import { hydrateItemCharacters } from "./itemCharacter";
import { findMountedItemByItemCharacterId } from "./vehicleMountedItem";

export class VehicleCargoConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VehicleCargoConflictError";
  }
}

function toCargoItem(
  entry: Awaited<ReturnType<typeof hydrateItemCharacters>>[number]
): VehicleCargoItem {
  const quantity = entry.quantity ?? 1;
  const unitWeight = entry.item?.weight ?? 0;
  return {
    itemCharacterId: entry.id,
    quantity,
    customName: entry.customName,
    status: entry.status,
    weightKg: unitWeight * quantity,
    item: entry.item
      ? {
          id: entry.item.id,
          name: entry.item.name,
          type: entry.item.type,
          imageKey: entry.item.imageKey,
          weight: entry.item.weight,
        }
      : null,
  };
}

async function listCargoForVehicle(
  vehicleCharacterId: string,
  ownerCharacterId: string
): Promise<{ cargoItems: VehicleCargoItem[]; cargoWeightKg: number }> {
  const location = vehicleCargoItemLocation(vehicleCharacterId);
  const rows = await prisma.itemCharacter.findMany({
    where: {
      characterId: ownerCharacterId,
      itemLocation: location,
    },
  });
  const hydrated = await hydrateItemCharacters(rows);
  const cargoItems = hydrated.map(toCargoItem);
  const cargoWeightKg = cargoItems.reduce(
    (sum, item) => sum + item.weightKg,
    0
  );
  return { cargoItems, cargoWeightKg };
}

export async function listCargoForVehicles(
  vehicles: Array<{ id: string; characterId: string }>
): Promise<
  Map<string, { cargoItems: VehicleCargoItem[]; cargoWeightKg: number }>
> {
  const result = new Map<
    string,
    { cargoItems: VehicleCargoItem[]; cargoWeightKg: number }
  >();
  for (const vehicle of vehicles) {
    result.set(vehicle.id, { cargoItems: [], cargoWeightKg: 0 });
  }
  if (vehicles.length === 0) return result;

  await Promise.all(
    vehicles.map(async (vehicle) => {
      const cargo = await listCargoForVehicle(vehicle.id, vehicle.characterId);
      result.set(vehicle.id, cargo);
    })
  );
  return result;
}

export async function stowItemAsVehicleCargo(args: {
  ownerCharacterId: string;
  vehicleCharacterId: string;
  itemCharacterId: string;
  maxCargoWeightKg: number | null | undefined;
}): Promise<VehicleCargoItem> {
  const vehicle = await prisma.vehicleCharacter.findFirst({
    where: {
      id: args.vehicleCharacterId,
      characterId: args.ownerCharacterId,
    },
  });
  if (!vehicle) {
    throw new VehicleCargoConflictError("Vehicle not found for this character");
  }

  const item = await prisma.itemCharacter.findFirst({
    where: { id: args.itemCharacterId, characterId: args.ownerCharacterId },
  });
  if (!item) {
    throw new VehicleCargoConflictError(
      "Item not found in this character's inventory"
    );
  }

  const targetLocation = vehicleCargoItemLocation(args.vehicleCharacterId);
  if (item.itemLocation === targetLocation) {
    throw new VehicleCargoConflictError(
      "That item is already in this vehicle's cargo"
    );
  }

  const mounted = await findMountedItemByItemCharacterId(args.itemCharacterId);
  if (mounted) {
    throw new VehicleCargoConflictError(
      "Detach the mounted item before stowing it as cargo"
    );
  }

  const [hydrated] = await hydrateItemCharacters([item]);
  const itemWeight = getInventoryEntryCarriedWeight({
    ...hydrated,
    // Cargo weight uses full stack weight, not worn relief.
    equipSlots: [],
  });

  if (args.maxCargoWeightKg != null) {
    const { cargoWeightKg } = await listCargoForVehicle(
      args.vehicleCharacterId,
      args.ownerCharacterId
    );
    if (cargoWeightKg + itemWeight > args.maxCargoWeightKg + 1e-9) {
      throw new VehicleCargoConflictError(
        `Stowing this item would exceed cargo capacity (${args.maxCargoWeightKg} kg)`
      );
    }
  }

  await prisma.itemCharacter.update({
    where: { id: item.id },
    data: {
      itemLocation: targetLocation,
      isEquipped: false,
      equipSlots: [],
    },
  });

  const [updated] = await hydrateItemCharacters([
    {
      ...item,
      itemLocation: targetLocation,
      isEquipped: false,
      equipSlots: [],
    },
  ]);
  return toCargoItem(updated);
}

export async function retrieveItemFromVehicleCargo(args: {
  ownerCharacterId: string;
  vehicleCharacterId: string;
  itemCharacterId: string;
}): Promise<void> {
  const vehicle = await prisma.vehicleCharacter.findFirst({
    where: {
      id: args.vehicleCharacterId,
      characterId: args.ownerCharacterId,
    },
  });
  if (!vehicle) {
    throw new VehicleCargoConflictError("Vehicle not found for this character");
  }

  const location = vehicleCargoItemLocation(args.vehicleCharacterId);
  const item = await prisma.itemCharacter.findFirst({
    where: {
      id: args.itemCharacterId,
      characterId: args.ownerCharacterId,
      itemLocation: location,
    },
  });
  if (!item) {
    throw new VehicleCargoConflictError("Cargo item not found on this vehicle");
  }

  await prisma.itemCharacter.update({
    where: { id: item.id },
    data: { itemLocation: ITEM_LOCATION_CARRIED },
  });
}

export async function returnAllVehicleCargoToCarried(
  vehicleCharacterId: string,
  ownerCharacterId: string
): Promise<number> {
  const location = vehicleCargoItemLocation(vehicleCharacterId);
  const result = await prisma.itemCharacter.updateMany({
    where: {
      characterId: ownerCharacterId,
      itemLocation: location,
    },
    data: {
      itemLocation: ITEM_LOCATION_CARRIED,
      isEquipped: false,
      equipSlots: [],
    },
  });
  return result.count;
}
