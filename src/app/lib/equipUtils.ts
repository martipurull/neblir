import type { EquipSlot } from "@/app/lib/types/character";

/** Display slots: Hand, Foot, and combined Body+Head */
export type DisplayEquipSlot = "HAND" | "FOOT" | "BODY_HEAD";

/** API slots that the combined BODY_HEAD display represents */
export const BODY_HEAD_SLOTS: EquipSlot[] = ["BODY", "HEAD"];

export const DISPLAY_SLOTS: { slot: DisplayEquipSlot; label: string }[] = [
  { slot: "HAND", label: "Hand" },
  { slot: "FOOT", label: "Foot" },
  { slot: "BODY_HEAD", label: "Body/Head" },
];

/** Capacity per API slot (HAND, FOOT, BODY, HEAD each have this) */
export const API_SLOT_CAPACITY = 2;

/** Capacity per display slot. BODY_HEAD = 4 (2+2), others = 2 */
export function getSlotCapacity(displaySlot: DisplayEquipSlot): number {
  return displaySlot === "BODY_HEAD" ? 4 : API_SLOT_CAPACITY;
}

/** Get API slots for a display slot (BODY_HEAD → [BODY, HEAD], others → [self]) */
export function getApiSlotsForDisplay(
  displaySlot: DisplayEquipSlot
): EquipSlot[] {
  return displaySlot === "BODY_HEAD" ? BODY_HEAD_SLOTS : [displaySlot];
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

/** Get total used capacity for a display slot (BODY_HEAD = sum of BODY + HEAD) */
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
