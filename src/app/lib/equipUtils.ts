import type { EquipSlot } from "@/app/lib/types/character";

/** Header equip cells map 1:1 to API equip slots */
export type DisplayEquipSlot = EquipSlot;

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
    equipSlots?: string[];
    item?: { equipSlotCost?: number | null } | null;
  }[],
  slot: EquipSlot
): number {
  let sum = 0;
  for (const entry of inventory) {
    const cost = getItemCost(entry.item?.equipSlotCost);
    const count = (entry.equipSlots ?? []).filter((s) => s === slot).length;
    sum += count * cost;
  }
  return sum;
}

/** Get total used capacity for a header display slot */
export function getUsedCapacityForDisplaySlot(
  inventory: {
    equipSlots?: string[];
    item?: { equipSlotCost?: number | null } | null;
  }[],
  displaySlot: DisplayEquipSlot
): number {
  const apiSlots = getApiSlotsForDisplay(displaySlot);
  return apiSlots.reduce(
    (sum, s) => sum + getUsedCapacityInApiSlot(inventory, s),
    0
  );
}
