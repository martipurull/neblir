import { isItemInventoryOperational } from "@/app/lib/types/item";
import type { VehicleMountedItem } from "@/app/lib/types/vehicle";
import {
  ITEM_LOCATION_CARRIED,
  isItemCarried,
  vehicleMountedItemLocation,
} from "@/app/lib/constants/inventory";
import { prisma } from "./client";
import { hydrateItemCharacters } from "./itemCharacter";

type VehicleMountedItemRow = {
  id: string;
  vehicleCharacterId: string;
  itemCharacterId: string;
  mountSlot: string | null;
  createdAt: Date;
};

export class VehicleMountedItemConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VehicleMountedItemConflictError";
  }
}

async function hydrateMountedItemRows(
  rows: VehicleMountedItemRow[]
): Promise<VehicleMountedItem[]> {
  if (rows.length === 0) return [];

  const itemRecords = await prisma.itemCharacter.findMany({
    where: { id: { in: rows.map((row) => row.itemCharacterId) } },
  });
  const hydratedItems = await hydrateItemCharacters(itemRecords);
  const byId = new Map(hydratedItems.map((item) => [item.id, item]));

  return rows.map((row) => {
    const itemCharacter = byId.get(row.itemCharacterId) ?? null;
    return {
      id: row.id,
      vehicleCharacterId: row.vehicleCharacterId,
      itemCharacterId: row.itemCharacterId,
      mountSlot: row.mountSlot,
      itemCharacter: itemCharacter
        ? {
            id: itemCharacter.id,
            customName: itemCharacter.customName,
            status: itemCharacter.status,
            isEquipped: itemCharacter.isEquipped,
            item: itemCharacter.item
              ? {
                  id: itemCharacter.item.id,
                  name: itemCharacter.item.name,
                  type: itemCharacter.item.type,
                  imageKey: itemCharacter.item.imageKey,
                  weight: itemCharacter.item.weight,
                }
              : null,
          }
        : null,
    };
  });
}

export async function listMountedItemsForVehicle(
  vehicleCharacterId: string
): Promise<VehicleMountedItem[]> {
  const rows = await prisma.vehicleMountedItem.findMany({
    where: { vehicleCharacterId },
    orderBy: { createdAt: "asc" },
  });
  return hydrateMountedItemRows(rows);
}

export async function listMountedItemsForVehicles(
  vehicleCharacterIds: string[]
): Promise<Map<string, VehicleMountedItem[]>> {
  const result = new Map<string, VehicleMountedItem[]>();
  for (const id of vehicleCharacterIds) {
    result.set(id, []);
  }
  if (vehicleCharacterIds.length === 0) return result;

  const rows = await prisma.vehicleMountedItem.findMany({
    where: { vehicleCharacterId: { in: vehicleCharacterIds } },
    orderBy: { createdAt: "asc" },
  });
  const hydrated = await hydrateMountedItemRows(rows);
  for (const item of hydrated) {
    const list = result.get(item.vehicleCharacterId) ?? [];
    list.push(item);
    result.set(item.vehicleCharacterId, list);
  }
  return result;
}

export async function findMountedItemByItemCharacterId(
  itemCharacterId: string
): Promise<VehicleMountedItemRow | null> {
  return prisma.vehicleMountedItem.findUnique({
    where: { itemCharacterId },
  });
}

export async function attachItemToVehicle(args: {
  characterId: string;
  vehicleCharacterId: string;
  itemCharacterId: string;
  mountSlot?: string | null;
  maxMountedItems?: number | null;
}): Promise<VehicleMountedItem> {
  const vehicle = await prisma.vehicleCharacter.findFirst({
    where: {
      id: args.vehicleCharacterId,
      characterId: args.characterId,
    },
  });
  if (!vehicle) {
    throw new VehicleMountedItemConflictError(
      "Vehicle not found for this character"
    );
  }

  const itemCharacter = await prisma.itemCharacter.findFirst({
    where: { id: args.itemCharacterId, characterId: args.characterId },
  });
  if (!itemCharacter) {
    throw new VehicleMountedItemConflictError(
      "Item not found in this character's inventory"
    );
  }

  if (!isItemInventoryOperational(itemCharacter.status)) {
    throw new VehicleMountedItemConflictError(
      "Broken or beyond-repair items cannot be mounted on a vehicle"
    );
  }

  if (!isItemCarried(itemCharacter)) {
    throw new VehicleMountedItemConflictError(
      "Only carried items can be mounted on a vehicle"
    );
  }

  const hydratedInventory = await hydrateItemCharacters([itemCharacter]);
  const resolved = hydratedInventory[0]?.item;
  if (resolved?.vehicleMountable !== true) {
    throw new VehicleMountedItemConflictError(
      "This item cannot be mounted on a vehicle"
    );
  }

  const existingMount = await findMountedItemByItemCharacterId(
    args.itemCharacterId
  );
  if (existingMount) {
    throw new VehicleMountedItemConflictError(
      existingMount.vehicleCharacterId === args.vehicleCharacterId
        ? "That item is already mounted on this vehicle"
        : "That item is already mounted on another vehicle"
    );
  }

  const maxMountedItems = args.maxMountedItems ?? null;
  if (maxMountedItems != null) {
    const currentCount = await prisma.vehicleMountedItem.count({
      where: { vehicleCharacterId: args.vehicleCharacterId },
    });
    if (currentCount >= maxMountedItems) {
      throw new VehicleMountedItemConflictError(
        `This vehicle can only mount ${maxMountedItems} item${maxMountedItems === 1 ? "" : "s"}`
      );
    }
  }

  const mountedLocation = vehicleMountedItemLocation(args.vehicleCharacterId);

  const created = await prisma.$transaction(async (tx) => {
    await tx.itemCharacter.update({
      where: { id: itemCharacter.id },
      data: {
        itemLocation: mountedLocation,
        isEquipped: false,
        equipSlots: [],
      },
    });

    return tx.vehicleMountedItem.create({
      data: {
        vehicleCharacterId: args.vehicleCharacterId,
        itemCharacterId: args.itemCharacterId,
        mountSlot: args.mountSlot?.trim() ?? null,
      },
    });
  });

  const [hydrated] = await hydrateMountedItemRows([created]);
  return hydrated;
}

export async function detachItemFromVehicle(args: {
  characterId: string;
  vehicleCharacterId: string;
  mountedItemId: string;
}): Promise<void> {
  const vehicle = await prisma.vehicleCharacter.findFirst({
    where: {
      id: args.vehicleCharacterId,
      characterId: args.characterId,
    },
  });
  if (!vehicle) {
    throw new VehicleMountedItemConflictError(
      "Vehicle not found for this character"
    );
  }

  const row = await prisma.vehicleMountedItem.findFirst({
    where: {
      id: args.mountedItemId,
      vehicleCharacterId: args.vehicleCharacterId,
    },
  });
  if (!row) {
    throw new VehicleMountedItemConflictError("Mounted item not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.vehicleMountedItem.delete({ where: { id: row.id } });
    await tx.itemCharacter.update({
      where: { id: row.itemCharacterId },
      data: { itemLocation: ITEM_LOCATION_CARRIED },
    });
  });
}
