import {
  ITEM_LOCATION_CARRIED,
  botCargoCapacityMessage,
  botItemLocation,
  isItemCarried,
  parseBotItemLocation,
  parseVehicleCargoItemLocation,
  parseVehicleMountedItemLocation,
  type BotPlacement,
} from "@/app/lib/constants/inventory";
import type { BotPlacedItem, BotPlacementSummary } from "@/app/lib/types/bot";
import { prisma } from "./client";
import { hydrateItemCharacters } from "./itemCharacter";

export class BotPlacementConflictError extends Error {
  readonly status: 404 | 409;

  constructor(message: string, status: 404 | 409 = 409) {
    super(message);
    this.name = "BotPlacementConflictError";
    this.status = status;
  }
}

export const BOT_NOT_INSTALLABLE_MESSAGE =
  "This item cannot be installed on a bot";

export const BOT_ALREADY_ON_VEHICLE_MESSAGE =
  "That item is already on a vehicle";

export const BOT_HOLDING_REMOVE_BLOCKED_MESSAGE =
  "Return placed items to carried inventory before removing this bot";

export const BOT_HOLDING_MOVE_BLOCKED_MESSAGE =
  "Return placed items to carried inventory before moving this bot";

type InventoryRow = {
  id: string;
  characterId: string;
  itemId: string;
  quantity: number;
  itemLocation: string | null;
  customName: string | null;
  status: string;
  isEquipped: boolean;
  equipSlots: string[];
};

type HydratedRow = InventoryRow & {
  item?: {
    id?: string;
    name?: string;
    weight?: number | null;
    botInstallable?: boolean | null;
  } | null;
};

function emptyPlacements(): BotPlacementSummary {
  return {
    installedItems: [],
    cargoItems: [],
    carriedItems: [],
    installedCount: 0,
    cargoWeightKg: 0,
    carriedWeightKg: 0,
  };
}

function stackWeightKg(quantity: number, unitWeight: number): number {
  return quantity * unitWeight;
}

function toPlacedItem(entry: HydratedRow): BotPlacedItem {
  const quantity = entry.quantity ?? 1;
  const unitWeight = entry.item?.weight ?? 0;
  return {
    itemCharacterId: entry.id,
    quantity,
    weightKg: stackWeightKg(quantity, unitWeight),
    customName: entry.customName,
    item: entry.item?.id
      ? {
          id: entry.item.id,
          name: entry.item.name ?? "Item",
          weight: unitWeight,
          botInstallable: entry.item.botInstallable === true,
        }
      : null,
  };
}

function summaryFromRows(
  holdingId: string,
  rows: HydratedRow[]
): BotPlacementSummary {
  const installedItems: BotPlacedItem[] = [];
  const cargoItems: BotPlacedItem[] = [];
  const carriedItems: BotPlacedItem[] = [];
  for (const row of rows) {
    const place = parseBotItemLocation(row.itemLocation);
    if (place?.botCharacterId !== holdingId) continue;
    const placed = toPlacedItem(row);
    if (place.place === "installed") installedItems.push(placed);
    else if (place.place === "cargo") cargoItems.push(placed);
    else carriedItems.push(placed);
  }
  return {
    installedItems,
    cargoItems,
    carriedItems,
    installedCount: installedItems.length,
    cargoWeightKg: cargoItems.reduce((sum, item) => sum + item.weightKg, 0),
    carriedWeightKg: carriedItems.reduce((sum, item) => sum + item.weightKg, 0),
  };
}

async function inventoryForCharacters(
  characterIds: string[]
): Promise<Map<string, HydratedRow[]>> {
  const grouped = new Map<string, HydratedRow[]>();
  for (const id of characterIds) grouped.set(id, []);
  if (characterIds.length === 0) return grouped;
  const rows = await prisma.itemCharacter.findMany({
    where: { characterId: { in: characterIds } },
  });
  const hydrated = (await hydrateItemCharacters(rows)) as HydratedRow[];
  for (const row of hydrated) {
    const list = grouped.get(row.characterId) ?? [];
    list.push(row);
    grouped.set(row.characterId, list);
  }
  return grouped;
}

export async function placementsByHolding(
  characterId: string,
  holdingIds: string[]
): Promise<Map<string, BotPlacementSummary>> {
  const result = new Map<string, BotPlacementSummary>();
  for (const id of holdingIds) result.set(id, emptyPlacements());
  if (holdingIds.length === 0) return result;
  const inventory = await inventoryForCharacters([characterId]);
  const rows = inventory.get(characterId) ?? [];
  for (const holdingId of holdingIds) {
    result.set(holdingId, summaryFromRows(holdingId, rows));
  }
  return result;
}

export async function placementsForHoldings(
  holdings: Array<{ id: string; characterId: string }>
): Promise<Map<string, BotPlacementSummary>> {
  const result = new Map<string, BotPlacementSummary>();
  for (const holding of holdings) {
    result.set(holding.id, emptyPlacements());
  }
  if (holdings.length === 0) return result;
  const characterIds = [
    ...new Set(holdings.map((holding) => holding.characterId)),
  ];
  const inventory = await inventoryForCharacters(characterIds);
  for (const holding of holdings) {
    const rows = inventory.get(holding.characterId) ?? [];
    result.set(holding.id, summaryFromRows(holding.id, rows));
  }
  return result;
}

export async function botHoldingHasPlacements(
  characterId: string,
  botCharacterId: string
): Promise<boolean> {
  const summaries = await placementsByHolding(characterId, [botCharacterId]);
  const summary = summaries.get(botCharacterId) ?? emptyPlacements();
  return (
    summary.installedCount > 0 ||
    summary.cargoItems.length > 0 ||
    summary.carriedItems.length > 0
  );
}

function installedCapacityMessage(maxInstalledItems: number): string {
  return `This bot can only install ${maxInstalledItems} item${maxInstalledItems === 1 ? "" : "s"}`;
}

export async function placeItemOnBot(args: {
  characterId: string;
  botCharacterId: string;
  itemCharacterId: string;
  place: BotPlacement;
  maxCargoWeightKg: number | null;
  maxInstalledItems: number | null;
}): Promise<void> {
  const holding = await prisma.botCharacter.findFirst({
    where: { id: args.botCharacterId, characterId: args.characterId },
  });
  if (!holding) {
    throw new BotPlacementConflictError(
      "Bot holding not found for this character",
      404
    );
  }

  const item = await prisma.itemCharacter.findFirst({
    where: { id: args.itemCharacterId, characterId: args.characterId },
  });
  if (!item) {
    throw new BotPlacementConflictError(
      "Item not found in this character's inventory",
      404
    );
  }

  const onVehicle =
    parseVehicleCargoItemLocation(item.itemLocation) != null ||
    parseVehicleMountedItemLocation(item.itemLocation) != null;
  if (onVehicle) {
    throw new BotPlacementConflictError(BOT_ALREADY_ON_VEHICLE_MESSAGE);
  }

  const currentPlace = parseBotItemLocation(item.itemLocation);
  if (currentPlace && currentPlace.botCharacterId !== args.botCharacterId) {
    throw new BotPlacementConflictError(
      "That item is already placed on another bot"
    );
  }
  if (!currentPlace && !isItemCarried(item)) {
    throw new BotPlacementConflictError(
      "Only carried items can be placed on a bot"
    );
  }
  if (
    currentPlace?.botCharacterId === args.botCharacterId &&
    currentPlace.place === args.place
  ) {
    throw new BotPlacementConflictError(
      "That item is already in that place on this bot"
    );
  }

  const [hydrated] = (await hydrateItemCharacters([item])) as HydratedRow[];
  const quantity = item.quantity ?? 1;
  const unitWeight = hydrated?.item?.weight ?? 0;
  const incomingWeight = stackWeightKg(quantity, unitWeight);

  const inventory = await inventoryForCharacters([args.characterId]);
  const rows = inventory.get(args.characterId) ?? [];
  const current = summaryFromRows(args.botCharacterId, rows);

  if (args.place === "installed") {
    if (hydrated?.item?.botInstallable !== true) {
      throw new BotPlacementConflictError(BOT_NOT_INSTALLABLE_MESSAGE);
    }
    if (args.maxInstalledItems != null) {
      const alreadyInstalled = currentPlace?.place === "installed";
      const nextCount = current.installedCount + (alreadyInstalled ? 0 : 1);
      if (nextCount > args.maxInstalledItems) {
        throw new BotPlacementConflictError(
          installedCapacityMessage(args.maxInstalledItems)
        );
      }
    }
  }

  if (args.place === "cargo" && args.maxCargoWeightKg != null) {
    const alreadyCargo = currentPlace?.place === "cargo";
    const nextWeight =
      current.cargoWeightKg + (alreadyCargo ? 0 : incomingWeight);
    if (nextWeight > args.maxCargoWeightKg + 1e-9) {
      throw new BotPlacementConflictError(
        botCargoCapacityMessage(args.maxCargoWeightKg)
      );
    }
  }

  const targetLocation = botItemLocation(args.place, args.botCharacterId);
  await prisma.$transaction(async (tx) => {
    await tx.botInstalledItem.deleteMany({
      where: { itemCharacterId: item.id },
    });
    await tx.itemCharacter.update({
      where: { id: item.id },
      data: {
        itemLocation: targetLocation,
        isEquipped: false,
        equipSlots: [],
      },
    });
    if (args.place === "installed") {
      await tx.botInstalledItem.create({
        data: {
          botCharacterId: args.botCharacterId,
          itemCharacterId: item.id,
        },
      });
    }
  });
}

export async function returnBotItemToCarried(args: {
  characterId: string;
  botCharacterId: string;
  itemCharacterId: string;
}): Promise<void> {
  const holding = await prisma.botCharacter.findFirst({
    where: { id: args.botCharacterId, characterId: args.characterId },
  });
  if (!holding) {
    throw new BotPlacementConflictError(
      "Bot holding not found for this character",
      404
    );
  }

  const item = await prisma.itemCharacter.findFirst({
    where: { id: args.itemCharacterId, characterId: args.characterId },
  });
  const place = parseBotItemLocation(item?.itemLocation);
  if (!item || place?.botCharacterId !== args.botCharacterId) {
    throw new BotPlacementConflictError(
      "That item is not placed on this bot",
      404
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.botInstalledItem.deleteMany({
      where: { itemCharacterId: item.id },
    });
    await tx.itemCharacter.update({
      where: { id: item.id },
      data: { itemLocation: ITEM_LOCATION_CARRIED },
    });
  });
}
