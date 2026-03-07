import { getCarriedInventory } from "@/app/lib/constants/inventory";

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
