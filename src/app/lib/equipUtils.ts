import type { EquipSlot } from "@/app/lib/types/character";
import {
  isItemInventoryOperational,
  type ItemStatus,
} from "@/app/lib/types/item";

/** Header equip cells map 1:1 to API equip slots */
export type DisplayEquipSlot = EquipSlot;

/** Order used when an item has no equipSlotTypes (fits any slot). */
export const AUTO_EQUIP_SLOT_TRY_ORDER: readonly EquipSlot[] = [
  "HAND",
  "FOOT",
  "BODY",
  "HEAD",
  "BRAIN",
] as const;

type CarriedEntryForCapacity = {
  id: string;
  status?: ItemStatus;
  equipSlots?: string[];
  item?: {
    equipSlotCost?: number | null;
    equipSlotTypes?: string[] | null;
  } | null;
};

/** Item template spans body + head as one garment (shared body/head slot budget). */
export function isCombinedBodyHeadSuit(
  equipSlotTypes: string[] | undefined | null
): boolean {
  const types = equipSlotTypes?.filter(Boolean) ?? [];
  return types.includes("BODY") && types.includes("HEAD");
}

/**
 * How many fully equipped "copies" this stack represents.
 * Multi-slot items (e.g. HEAD+BODY armour): one copy needs one of each type.
 */
export function getEquippedInstanceCount(
  equipSlots: string[] | undefined,
  equipSlotTypes: string[] | undefined | null
): number {
  const slots = equipSlots ?? [];
  const types = equipSlotTypes?.filter(Boolean) ?? [];
  if (types.length === 0) {
    return slots.length;
  }
  if (types.length === 1) {
    return slots.filter((s) => s === types[0]).length;
  }
  const uniqueTypes = [...new Set(types)];
  return Math.min(
    ...uniqueTypes.map((t) => slots.filter((s) => s === t).length)
  );
}

/**
 * Slots to add so the next equipped instance is complete (fills missing types
 * for partial multi-slot state, or adds one slot for single/flexible items).
 */
export function getAutoEquipSlotAdds(
  equipSlots: string[],
  equipSlotTypes: string[] | undefined | null
): EquipSlot[] {
  const types = equipSlotTypes?.filter(Boolean) ?? [];
  if (types.length === 0) {
    return [];
  }
  const uniqueTypes = [...new Set(types)] as EquipSlot[];
  const instances = getEquippedInstanceCount(equipSlots, types);
  const target = instances + 1;
  const adds: EquipSlot[] = [];
  for (const t of uniqueTypes) {
    const have = equipSlots.filter((s) => s === t).length;
    for (let i = have; i < target; i++) {
      adds.push(t);
    }
  }
  return adds;
}

/** True if assigning these equip slots to the entry stays within capacity everywhere. */
export function isWithinSlotCapacity(
  carriedInventory: CarriedEntryForCapacity[],
  entryId: string,
  nextEquipSlots: string[]
): boolean {
  const hyp = carriedInventory.map((e) =>
    e.id === entryId ? { ...e, equipSlots: nextEquipSlots } : e
  );
  for (const slot of AUTO_EQUIP_SLOT_TRY_ORDER) {
    if (getUsedCapacityInApiSlot(hyp, slot) > API_SLOT_CAPACITY) {
      return false;
    }
  }
  return true;
}

export function pickFirstFlexibleEquipSlot(
  carriedInventory: CarriedEntryForCapacity[],
  entryId: string,
  currentEquipSlots: string[]
): EquipSlot | null {
  for (const slot of AUTO_EQUIP_SLOT_TRY_ORDER) {
    const next = [...currentEquipSlots, slot];
    if (isWithinSlotCapacity(carriedInventory, entryId, next)) {
      return slot;
    }
  }
  return null;
}

/** Whether one more auto-equip (all required slots) is allowed for this stack. */
export function entryCanAutoEquip(
  entry: CarriedEntryForCapacity & {
    quantity: number;
    item?: {
      equippable?: boolean | null;
      equipSlotTypes?: string[] | null;
    } | null;
  },
  carriedInventory: CarriedEntryForCapacity[]
): boolean {
  if (entry.status != null && !isItemInventoryOperational(entry.status)) {
    return false;
  }
  if (entry.item?.equippable !== true) return false;
  const types = entry.item?.equipSlotTypes;
  if (getEquippedInstanceCount(entry.equipSlots, types) >= entry.quantity) {
    return false;
  }
  const typesList = types?.filter(Boolean) ?? [];
  if (typesList.length === 0) {
    return (
      pickFirstFlexibleEquipSlot(
        carriedInventory,
        entry.id,
        entry.equipSlots ?? []
      ) != null
    );
  }
  const adds = getAutoEquipSlotAdds(entry.equipSlots ?? [], types);
  const nextSlots = [...(entry.equipSlots ?? []), ...adds];
  return isWithinSlotCapacity(carriedInventory, entry.id, nextSlots);
}

/** First header row: Hand, Foot, Body */
export const HEADER_EQUIP_SLOTS_ROW1: {
  slot: DisplayEquipSlot;
  label: string;
}[] = [
  { slot: "HAND", label: "Hand" },
  { slot: "FOOT", label: "Foot" },
  { slot: "BODY", label: "Body" },
];

/** Second header row: Head, Brain (carry weight is a separate StatCell) */
export const HEADER_EQUIP_SLOTS_ROW2: {
  slot: DisplayEquipSlot;
  label: string;
}[] = [
  { slot: "HEAD", label: "Head" },
  { slot: "BRAIN", label: "Brain" },
];

/** Capacity per API slot (HAND, FOOT, BODY, HEAD, BRAIN each have this) */
export const API_SLOT_CAPACITY = 2;

/** Capacity per display slot (same as API — each cell is one slot) */
export function getSlotCapacity(_displaySlot: DisplayEquipSlot): number {
  return API_SLOT_CAPACITY;
}

/** API slot(s) represented by a header equip cell */
export function getApiSlotsForDisplay(
  displaySlot: DisplayEquipSlot
): EquipSlot[] {
  return [displaySlot];
}

/** Default cost when item has no equipSlotCost (0, 1, or 2) */
export function getItemCost(equipSlotCost: number | null | undefined): number {
  if (equipSlotCost === 0 || equipSlotCost === 1 || equipSlotCost === 2) {
    return equipSlotCost;
  }
  return 1;
}

/** Check if item can be equipped in slot (by equipSlotTypes) */
export function itemCanEquipInSlot(
  slot: EquipSlot,
  equipSlotTypes: string[] | undefined
): boolean {
  if (!equipSlotTypes?.length) return true;
  return equipSlotTypes.includes(slot);
}

/** Get used capacity in a single API slot */
export function getUsedCapacityInApiSlot(
  inventory: {
    status?: ItemStatus;
    equipSlots?: string[];
    item?: {
      equipSlotCost?: number | null;
      equipSlotTypes?: string[] | null;
    } | null;
  }[],
  slot: EquipSlot
): number {
  let sum = 0;
  for (const entry of inventory) {
    if (entry.status != null && !isItemInventoryOperational(entry.status)) {
      continue;
    }
    const rawCost = getItemCost(entry.item?.equipSlotCost);
    const suit =
      isCombinedBodyHeadSuit(entry.item?.equipSlotTypes) &&
      (slot === "BODY" || slot === "HEAD");
    const cost =
      suit && (entry.equipSlots ?? []).includes(slot)
        ? Math.min(rawCost, 1)
        : rawCost;
    const count = (entry.equipSlots ?? []).filter((s) => s === slot).length;
    sum += count * cost;
  }
  return sum;
}

/** Get total used capacity for a header display slot */
export function getUsedCapacityForDisplaySlot(
  inventory: {
    equipSlots?: string[];
    item?: {
      equipSlotCost?: number | null;
      equipSlotTypes?: string[] | null;
    } | null;
  }[],
  displaySlot: DisplayEquipSlot
): number {
  const apiSlots = getApiSlotsForDisplay(displaySlot);
  return apiSlots.reduce(
    (sum, s) => sum + getUsedCapacityInApiSlot(inventory, s),
    0
  );
}
