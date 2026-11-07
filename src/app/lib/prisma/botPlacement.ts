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
import {
  BOT_BODY_FULL_MESSAGE,
  BOT_CARRY_LIMIT_MESSAGE,
  BOT_EQUIP_NOT_CARRIED_MESSAGE,
  BOT_EQUIP_SLOT_REFUSED_MESSAGE,
  BOT_HANDS_FULL_MESSAGE,
  BOT_ITEM_SLOT_MESSAGE,
  BOT_NOT_EQUIPPED_MESSAGE,
  botBodyOccupied,
  botCarriedLoadRefused,
  botEffectiveMaxCarry,
  botEquipSlotRefused,
  botHandCanFit,
  botHandsUsed,
  itemFitsBotSlot,
} from "@/app/lib/botCarry";
import { readBotActionList } from "@/app/lib/botActions";
import { getItemCost } from "@/app/lib/equipUtils";
import type { BotAction } from "@/app/lib/types/botAction";
import type { BotPlacedItem, BotPlacementSummary } from "@/app/lib/types/bot";
import { prisma } from "./client";
import { hydrateItemCharacters, resolvedItemBotActions } from "./itemCharacter";

export class BotPlacementConflictError extends Error {
  readonly status: 404 | 409;

  constructor(message: string, status: 404 | 409 = 409) {
    super(message);
    this.name = "BotPlacementConflictError";
    this.status = status;
  }
}

const BOT_NOT_INSTALLABLE_MESSAGE = "This item cannot be installed on a bot";

const BOT_ALREADY_ON_VEHICLE_MESSAGE = "That item is already on a vehicle";

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
  botEquipSlots?: string[] | null;
};

type HydratedRow = InventoryRow & {
  item?: {
    id?: string;
    name?: string;
    weight?: number | null;
    botInstallable?: boolean | null;
    equipSlotCost?: number | null;
    equipSlotTypes?: string[] | null;
    botActions?: unknown;
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

function toPlacedItem(
  entry: HydratedRow,
  includeBotActions: boolean
): BotPlacedItem & { storedBotActions: BotAction[] } {
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
          equipSlotCost: entry.item.equipSlotCost ?? null,
          equipSlotTypes: entry.item.equipSlotTypes ?? [],
        }
      : null,
    botEquipSlots: entry.botEquipSlots ?? [],
    botActions: [],
    storedBotActions: includeBotActions
      ? readBotActionList(entry.item?.botActions)
      : [],
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
    const placed = toPlacedItem(row, place.place === "installed");
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
  maxCarryWeight: number | null;
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

  if (args.place === "carried") {
    const alreadyCarried = currentPlace?.place === "carried";
    const nextWeight =
      current.carriedWeightKg + (alreadyCarried ? 0 : incomingWeight);
    const effectiveMax = botEffectiveMaxCarry(
      args.maxCarryWeight,
      current.carriedItems.map((item) => ({
        botEquipSlots: item.botEquipSlots,
        itemName: item.item?.name,
      }))
    );
    if (botCarriedLoadRefused(nextWeight, effectiveMax)) {
      throw new BotPlacementConflictError(BOT_CARRY_LIMIT_MESSAGE);
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
        ...(args.place === "carried" ? {} : { botEquipSlots: [] }),
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
      data: { itemLocation: ITEM_LOCATION_CARRIED, botEquipSlots: [] },
    });
  });
}

export async function setBotEquip(args: {
  characterId: string;
  botCharacterId: string;
  itemCharacterId: string;
  action: "equip" | "unequip";
  slot: "HAND" | "FOOT" | "BODY" | "HEAD" | "BRAIN";
}): Promise<void> {
  if (botEquipSlotRefused(args.slot)) {
    throw new BotPlacementConflictError(BOT_EQUIP_SLOT_REFUSED_MESSAGE);
  }
  const slot = args.slot === "HAND" ? "HAND" : "BODY";

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
    throw new BotPlacementConflictError(BOT_EQUIP_NOT_CARRIED_MESSAGE);
  }
  if (place.place !== "carried") {
    throw new BotPlacementConflictError(BOT_EQUIP_NOT_CARRIED_MESSAGE);
  }

  const inventory = await inventoryForCharacters([args.characterId]);
  const rows = (inventory.get(args.characterId) ?? []).filter((row) => {
    const rowPlace = parseBotItemLocation(row.itemLocation);
    return (
      rowPlace?.botCharacterId === args.botCharacterId &&
      rowPlace.place === "carried"
    );
  });
  const [hydrated] = (await hydrateItemCharacters([item])) as HydratedRow[];
  const currentSlots = item.botEquipSlots ?? [];

  if (args.action === "unequip") {
    if (!currentSlots.includes(slot)) {
      throw new BotPlacementConflictError(BOT_NOT_EQUIPPED_MESSAGE);
    }
    await prisma.itemCharacter.update({
      where: { id: item.id },
      data: {
        botEquipSlots: currentSlots.filter((entry) => entry !== slot),
        isEquipped: false,
        equipSlots: [],
      },
    });
    return;
  }

  if (!itemFitsBotSlot(slot, hydrated?.item?.equipSlotTypes)) {
    throw new BotPlacementConflictError(BOT_ITEM_SLOT_MESSAGE);
  }
  if (currentSlots.includes(slot)) return;

  if (slot === "HAND") {
    const used = botHandsUsed(
      rows.map((row) => ({
        id: row.id,
        botEquipSlots: row.botEquipSlots,
        equipSlotCost: row.item?.equipSlotCost,
      }))
    );
    if (!botHandCanFit(used, getItemCost(hydrated?.item?.equipSlotCost))) {
      throw new BotPlacementConflictError(BOT_HANDS_FULL_MESSAGE);
    }
  } else if (
    botBodyOccupied(
      rows.map((row) => ({ id: row.id, botEquipSlots: row.botEquipSlots }))
    )
  ) {
    throw new BotPlacementConflictError(BOT_BODY_FULL_MESSAGE);
  }

  await prisma.itemCharacter.update({
    where: { id: item.id },
    data: {
      botEquipSlots: [...currentSlots, slot],
      isEquipped: false,
      equipSlots: [],
    },
  });
}

export const ITEM_NOT_INSTALLED_MESSAGE =
  "That item is not installed on this bot.";

export async function installedItemBotActions(
  characterId: string,
  botCharacterId: string,
  itemCharacterId: string
): Promise<
  | { ok: true; actions: BotAction[]; itemName: string }
  | { ok: false; status: 400 | 404; message: string }
> {
  const row = await prisma.itemCharacter.findUnique({
    where: { id: itemCharacterId },
  });
  if (row?.characterId !== characterId) {
    return { ok: false, status: 404, message: "Item not found" };
  }
  const place = parseBotItemLocation(row.itemLocation);
  if (place?.place !== "installed" || place.botCharacterId !== botCharacterId) {
    return { ok: false, status: 400, message: ITEM_NOT_INSTALLED_MESSAGE };
  }
  const resolved = await resolvedItemBotActions(row.sourceType, row.itemId);
  if (!resolved) {
    return { ok: false, status: 404, message: "Item not found" };
  }
  return { ok: true, actions: resolved.botActions, itemName: resolved.name };
}
