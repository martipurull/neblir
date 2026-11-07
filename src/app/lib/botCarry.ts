import {
  backpackCarryBonusFraction,
  getEffectiveSpeed,
  maxCarryWeightWithBackpackBonus,
} from "@/app/lib/carryWeightUtils";
import { getItemCost } from "@/app/lib/equipUtils";

export const BOT_CARRY_LIMIT_MESSAGE =
  "Carried load would pass 150% of max carry";

export const BOT_EQUIP_NOT_CARRIED_MESSAGE =
  "Only items this bot is carrying can be equipped";

export const BOT_EQUIP_SLOT_REFUSED_MESSAGE =
  "Bots cannot equip Foot, Head, or Brain";

export const BOT_HANDS_FULL_MESSAGE = "The bot's hands cannot fit that item";

export const BOT_BODY_FULL_MESSAGE =
  "The bot's Body slot cannot fit another item";

export const BOT_ITEM_SLOT_MESSAGE =
  "This item cannot be equipped in that slot";

export const BOT_NOT_EQUIPPED_MESSAGE =
  "That item is not equipped in that slot";

/** Hands hold a combined item cost of 2. Body holds one item. */
const BOT_HAND_CAPACITY = 2;

const BOT_REFUSED_SLOTS = new Set(["FOOT", "HEAD", "BRAIN"]);

export type BotLoadItem = {
  botEquipSlots?: string[] | null;
  itemName?: string | null;
};

export function botEquipSlotRefused(slot: string): boolean {
  return BOT_REFUSED_SLOTS.has(slot);
}

/** Empty slot types can use Hand or Body. A listed type must include the slot. */
export function itemFitsBotSlot(
  slot: "HAND" | "BODY",
  equipSlotTypes: string[] | null | undefined
): boolean {
  const types = equipSlotTypes?.filter(Boolean) ?? [];
  if (types.length === 0) return true;
  return types.includes(slot);
}

function botBackpackBonusFraction(items: BotLoadItem[]): number {
  let bonus = 0;
  for (const item of items) {
    if (!(item.botEquipSlots ?? []).includes("BODY")) continue;
    bonus += backpackCarryBonusFraction(item.itemName);
  }
  return bonus;
}

/** Effective max carry from the base plus any Body backpack. Not stored. */
export function botEffectiveMaxCarry(
  baseMaxCarryWeight: number | null | undefined,
  items: BotLoadItem[]
): number | null {
  return maxCarryWeightWithBackpackBonus(
    baseMaxCarryWeight,
    botBackpackBonusFraction(items)
  );
}

/** True when the next carried weight would pass 150% of effective max carry. */
export function botCarriedLoadRefused(
  nextCarriedWeight: number,
  effectiveMaxCarry: number | null
): boolean {
  if (effectiveMaxCarry == null || effectiveMaxCarry <= 0) {
    return nextCarriedWeight > 0;
  }
  return nextCarriedWeight / effectiveMaxCarry > 1.5;
}

/**
 * Carry-load speed with no armour penalty.
 * At or under half, unchanged; through 75%, minus 1; through 100%, minus 2;
 * through 150%, half the base rounded down; above 150%, 0. Never below 0.
 * Strikethrough is set when the load reduces the base.
 */
export function botSpeedFromLoad(
  baseSpeed: number,
  carriedWeight: number,
  effectiveMaxCarry: number | null
): { effectiveSpeed: number; speedStrikethrough: boolean } {
  const base = Math.max(0, baseSpeed);
  if (effectiveMaxCarry == null || effectiveMaxCarry <= 0) {
    if (carriedWeight > 0) {
      return { effectiveSpeed: 0, speedStrikethrough: base > 0 };
    }
    return { effectiveSpeed: base, speedStrikethrough: false };
  }
  const { effectiveSpeed } = getEffectiveSpeed(
    base,
    carriedWeight,
    effectiveMaxCarry,
    0
  );
  const speed = Math.max(0, effectiveSpeed);
  return {
    effectiveSpeed: speed,
    speedStrikethrough: speed < base,
  };
}

type HandRow = {
  id: string;
  botEquipSlots?: string[] | null;
  equipSlotCost?: number | null;
};

export function botHandsUsed(rows: HandRow[], ignoreId?: string): number {
  let used = 0;
  for (const row of rows) {
    if (row.id === ignoreId) continue;
    if (!(row.botEquipSlots ?? []).includes("HAND")) continue;
    used += getItemCost(row.equipSlotCost);
  }
  return used;
}

export function botBodyOccupied(
  rows: Array<{ id: string; botEquipSlots?: string[] | null }>,
  ignoreId?: string
): boolean {
  return rows.some(
    (row) => row.id !== ignoreId && (row.botEquipSlots ?? []).includes("BODY")
  );
}

export function botHandCanFit(usedByOthers: number, itemCost: number): boolean {
  return usedByOthers + itemCost <= BOT_HAND_CAPACITY;
}
