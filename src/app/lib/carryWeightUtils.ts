import { getCarriedInventory } from "@/app/lib/constants/inventory";
import type { ItemStatus } from "@/app/lib/types/item";
import { isItemInventoryOperational } from "@/app/lib/types/item";

const BACKPACK_BONUSES: Record<string, number> = {
  "backpack (small)": 0.1,
  "backpack (medium)": 0.2,
  "backpack (large)": 0.3,
};

type InventoryEntry = {
  itemLocation?: string | null;
  quantity?: number;
  equipSlots?: string[];
  item?: { weight?: number | null; name?: string | null } | null;
};

/**
 * Bonus to max carry weight from equipped backpacks (UI only).
 * Returns a multiplier fraction to add (e.g. 0.1 + 0.2 = 0.3 for small + medium).
 */
function getCarryWeightBonusFromInventory(
  inventory: InventoryEntry[] | undefined
): number {
  const carried = getCarriedInventory(inventory ?? []);
  let bonus = 0;
  for (const entry of carried) {
    const equipCount = entry.equipSlots?.length ?? 0;
    if (equipCount === 0) continue;
    const name = (entry.item?.name ?? "").trim().toLowerCase();
    const add = BACKPACK_BONUSES[name];
    if (add != null) bonus += add;
  }
  return bonus;
}

/**
 * Effective max carry weight for UI: base max plus backpack bonuses (10% / 20% / 30%).
 * Does not change the character in the database.
 */
export function getEffectiveMaxCarryWeight(
  baseMaxCarryWeight: number | null | undefined,
  inventory: InventoryEntry[] | undefined
): number | null {
  if (baseMaxCarryWeight == null || baseMaxCarryWeight <= 0) return null;
  const bonus = getCarryWeightBonusFromInventory(inventory);
  if (bonus === 0) return baseMaxCarryWeight;
  return Math.floor(baseMaxCarryWeight * (1 + bonus));
}

/** Total weight of carried items (quantity × weight per entry) */
export function getCarriedWeight(
  inventory: InventoryEntry[] | undefined
): number {
  const carried = getCarriedInventory(inventory ?? []);
  return carried.reduce(
    (sum, entry) => sum + (entry.item?.weight ?? 0) * (entry.quantity ?? 1),
    0
  );
}

/** UI: kg with at most one decimal (avoids long float noise from per-item weights). */
export function formatWeightKgForDisplay(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const s = rounded.toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

/** Carry weight ratio (carried / max). Returns 0 if max is 0 or missing. */
export function getCarryWeightRatio(
  carriedWeight: number,
  maxCarryWeight: number | null | undefined
): number {
  if (maxCarryWeight == null || maxCarryWeight <= 0) return 0;
  return carriedWeight / maxCarryWeight;
}

/** True when character cannot add items (must store first) */
export function isOverCarryLimit(
  carriedWeight: number,
  maxCarryWeight: number | null | undefined
): boolean {
  return getCarryWeightRatio(carriedWeight, maxCarryWeight) >= 1.5;
}

/** Border + text classes for carry weight UI (Inventory pill + header StatCell). */
function getCarryWeightSemanticBorderAndText(
  carriedWeight: number,
  maxCarryWeight: number | null | undefined
): { border: string; text: string } {
  if (maxCarryWeight == null || maxCarryWeight <= 0) {
    return { border: "border-black", text: "text-black" };
  }
  const overCarryLimit = isOverCarryLimit(carriedWeight, maxCarryWeight);
  const ratio = getCarryWeightRatio(carriedWeight, maxCarryWeight);
  if (overCarryLimit || ratio > 1) {
    return {
      border: "border-neblirDanger-200",
      text: "text-neblirDanger-400",
    };
  }
  if (ratio >= 0.5) {
    return {
      border: "border-neblirWarning-200",
      text: "text-neblirWarning-400",
    };
  }
  return {
    border: "border-neblirSafe-200",
    text: "text-neblirSafe-400",
  };
}

/** Full className for the Inventory section carry-weight pill (matches prior inline logic). */
export function getCarryWeightInventoryPillClassName(
  carriedWeight: number,
  maxCarryWeight: number | null | undefined
): string {
  const { border, text } = getCarryWeightSemanticBorderAndText(
    carriedWeight,
    maxCarryWeight
  );
  return `rounded border ${border} bg-transparent px-2 py-0.5 text-sm tabular-nums ${text}`;
}

/** StatCell border + value colors for header carry weight. */
export function getCarryWeightStatCellStyles(
  carriedWeight: number,
  maxCarryWeight: number | null | undefined
): { borderClassName: string; valueClassName: string } {
  const { border, text } = getCarryWeightSemanticBorderAndText(
    carriedWeight,
    maxCarryWeight
  );
  return { borderClassName: border, valueClassName: text };
}

/**
 * Speed penalty from carry weight only (before armour).
 * Returns { effectiveSpeed, showStrikethrough }.
 * - ≤50%: normal
 * - 51–75%: -1
 * - 76–100%: -2
 * - 100–150%: half speed (floored)
 * - >150%: 0
 */
export function getCarryWeightSpeedEffect(
  baseSpeed: number,
  carriedWeight: number,
  maxCarryWeight: number | null | undefined
): { effectiveSpeed: number; showStrikethrough: boolean } {
  const ratio = getCarryWeightRatio(carriedWeight, maxCarryWeight);
  if (ratio <= 0.5) {
    return { effectiveSpeed: baseSpeed, showStrikethrough: false };
  }
  if (ratio <= 0.75) {
    return {
      effectiveSpeed: Math.max(0, baseSpeed - 1),
      showStrikethrough: true,
    };
  }
  if (ratio <= 1) {
    return {
      effectiveSpeed: Math.max(0, baseSpeed - 2),
      showStrikethrough: true,
    };
  }
  if (ratio <= 1.5) {
    return {
      effectiveSpeed: Math.floor(baseSpeed / 2),
      showStrikethrough: true,
    };
  }
  return { effectiveSpeed: 0, showStrikethrough: true };
}

/** Armour grade = armourMod (1–5). Speed penalty: grade 2,3 → -1; 4 → -2; 5 → -3 */
export function getArmourSpeedPenalty(armourMod: number): number {
  if (armourMod >= 5) return 3;
  if (armourMod >= 4) return 2;
  if (armourMod >= 2) return 1;
  return 0;
}

/** Armour penalty to agility/stealth (UI only): grade 3 → 1, 4 → 2, 5 → 3 */
export function getArmourAttributePenalty(armourMod: number): number {
  if (armourMod >= 5) return 3;
  if (armourMod >= 4) return 2;
  if (armourMod >= 3) return 1;
  return 0;
}

/** Innate attribute dice use a 1–5 scale; armour never reduces them below 1. */
export const MIN_INNATE_ATTRIBUTE_DICE = 1;

export function applyArmourPenaltyToInnateAttributeDice(
  cappedWithEquip: number,
  armourPenalty: number
): number {
  if (armourPenalty <= 0) return cappedWithEquip;
  return Math.max(MIN_INNATE_ATTRIBUTE_DICE, cappedWithEquip - armourPenalty);
}

/**
 * Final effective speed: base from combat, then carry weight effect, then armour penalty.
 */
export function getEffectiveSpeed(
  baseSpeed: number,
  carriedWeight: number,
  maxCarryWeight: number | null | undefined,
  armourMod: number
): { effectiveSpeed: number; showStrikethrough: boolean } {
  const fromCarry = getCarryWeightSpeedEffect(
    baseSpeed,
    carriedWeight,
    maxCarryWeight
  );
  const armourPenalty = getArmourSpeedPenalty(armourMod);
  const effective = Math.max(0, fromCarry.effectiveSpeed - armourPenalty);
  return {
    effectiveSpeed: effective,
    showStrikethrough: fromCarry.showStrikethrough || armourPenalty > 0,
  };
}

/**
 * Plain-language explanation for native tooltips when displayed speed is below base speed.
 */
export function getSpeedReductionTooltipText(
  baseSpeed: number,
  carriedWeight: number,
  maxCarryWeight: number | null | undefined,
  armourMod: number
): string {
  const fromCarry = getCarryWeightSpeedEffect(
    baseSpeed,
    carriedWeight,
    maxCarryWeight
  );
  const armourPenalty = getArmourSpeedPenalty(armourMod);
  const ratio = getCarryWeightRatio(carriedWeight, maxCarryWeight);
  const pct =
    maxCarryWeight != null && maxCarryWeight > 0
      ? Math.round(ratio * 100)
      : null;

  const parts: string[] = [];

  if (fromCarry.effectiveSpeed < baseSpeed) {
    if (pct != null && ratio > 0.5 && ratio <= 0.75) {
      parts.push(
        `Carried load is about ${pct}% of max carry weight; between 51% and 75% this reduces speed by 1 m.`
      );
    } else if (pct != null && ratio > 0.75 && ratio <= 1) {
      parts.push(
        `Carried load is about ${pct}% of max carry weight; between 76% and 100% this reduces speed by 2 m.`
      );
    } else if (pct != null && ratio > 1 && ratio <= 1.5) {
      parts.push(
        `Carried load is about ${pct}% of max carry weight; above 100% (up to 150%) your speed from encumbrance is halved (rounded down).`
      );
    } else if (pct != null && ratio > 1.5) {
      parts.push(
        `Carried load is about ${pct}% of max carry weight; above 150% encumbrance reduces speed to 0 m before armour.`
      );
    } else {
      parts.push(
        "Carried weight reduces speed relative to your maximum carry capacity."
      );
    }
  }

  if (armourPenalty > 0) {
    parts.push(
      `Armour modifier ${armourMod} applies an additional −${armourPenalty} m (grades 2–3: −1, 4: −2, 5: −3).`
    );
  }

  return parts.join(" ");
}

type SpeedAlterInventoryEntry = {
  isEquipped?: boolean;
  status?: ItemStatus;
  customName?: string | null;
  item?: { name?: string | null; isSpeedAltered?: boolean | null } | null;
};

/**
 * Equipped stack rows whose resolved item has `isSpeedAltered` (inventory API).
 */
export function getEquippedSpeedAlteringItems(
  inventory: SpeedAlterInventoryEntry[] | undefined
): { displayNames: string[]; tooltip: string } {
  const displayNames: string[] = [];
  for (const row of inventory ?? []) {
    if (!row.isEquipped) continue;
    if (row.status != null && !isItemInventoryOperational(row.status)) {
      continue;
    }
    if (row.item?.isSpeedAltered !== true) continue;
    const label =
      row.customName?.trim() ?? row.item?.name?.trim() ?? "Unknown item";
    displayNames.push(label);
  }
  const uniqueNames = [...new Set(displayNames)];
  const tooltip = formatSpeedAlteredTooltip(uniqueNames);
  return { displayNames: uniqueNames, tooltip };
}

function formatSpeedAlteredTooltip(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) {
    return `${names[0]} alters speed, check usage for more information.`;
  }
  const last = names[names.length - 1];
  const rest = names.slice(0, -1).join(", ");
  return `${rest} and ${last} alter speed, check each item's usage for more information.`;
}
