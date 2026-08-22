import type { ResolvedItemNonNull } from "./types";

export type WeaponDamageSlice = {
  numberOfDice: number;
  diceType: number;
  damageType?: string[] | null;
};

export function getWeaponDamage(
  item: ResolvedItemNonNull | null | undefined
): WeaponDamageSlice | null {
  if (item?.type !== "WEAPON") return null;
  if (!("damage" in item) || !item.damage) return null;
  if (
    item.damage.numberOfDice == null ||
    item.damage.diceType == null ||
    !Array.isArray(item.damage.damageType)
  ) {
    return null;
  }
  return {
    numberOfDice: item.damage.numberOfDice,
    diceType: item.damage.diceType,
    damageType: item.damage.damageType,
  };
}

export function hasExtraWeaponCombatStats(item: ResolvedItemNonNull): boolean {
  if (item.type !== "WEAPON") return false;
  return (
    item.attackThrowBonus != null ||
    item.defenceMeleeBonus != null ||
    item.defenceRangeBonus != null ||
    item.gridAttackBonus != null ||
    item.gridDefenceBonus != null
  );
}

/** Config-driven optional weapon stat cells (throw / def / grid). Order = display order. */
export const EXTRA_WEAPON_COMBAT_FIELDS = [
  { key: "attackThrowBonus" as const, label: "Throw atk" },
  { key: "defenceMeleeBonus" as const, label: "Melee def" },
  { key: "defenceRangeBonus" as const, label: "Range def" },
  { key: "gridAttackBonus" as const, label: "Grid atk" },
  { key: "gridDefenceBonus" as const, label: "Grid def" },
] as const;
