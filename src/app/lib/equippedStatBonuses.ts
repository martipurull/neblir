import { MIN_INNATE_ATTRIBUTE_DICE } from "@/app/lib/carryWeightUtils";
import type { CharacterDetail } from "@/app/lib/types/character";

export const ATTRIBUTE_SKILL_CAP = 5;

export type EquipmentBonusDetail = {
  total: number;
  sources: { label: string; amount: number }[];
};

function emptyDetail(): EquipmentBonusDetail {
  return { total: 0, sources: [] };
}

function pushSource(
  map: Map<string, EquipmentBonusDetail>,
  key: string,
  label: string,
  amount: number
) {
  if (amount === 0) return;
  const cur = map.get(key) ?? emptyDetail();
  cur.total += amount;
  cur.sources.push({ label, amount });
  map.set(key, cur);
}

/**
 * Sums attribute/skill modifiers from equipped, functional inventory rows * (resolved `item` must include modifier fields when set on templates).
 */
export function getEquippedItemStatBonusDetails(character: CharacterDetail): {
  byAttributePath: Map<string, EquipmentBonusDetail>;
  bySkill: Map<string, EquipmentBonusDetail>;
} {
  const byAttributePath = new Map<string, EquipmentBonusDetail>();
  const bySkill = new Map<string, EquipmentBonusDetail>();

  for (const inv of character.inventory ?? []) {
    if (!inv.isEquipped || inv.status !== "FUNCTIONAL") continue;
    const it = inv.item;
    if (!it) continue;

    const label = inv.customName?.trim() ?? it.name?.trim() ?? "Equipped item";

    if (it.modifiesAttribute != null && it.attributeMod != null) {
      pushSource(byAttributePath, it.modifiesAttribute, label, it.attributeMod);
    }
    if (it.modifiesSkill != null && it.skillMod != null) {
      pushSource(bySkill, it.modifiesSkill, label, it.skillMod);
    }
  }

  return { byAttributePath, bySkill };
}

/** General skills (and similar): 0–5 after equipment; no minimum above 0. */
export function capAttributeOrSkill(
  base: number,
  equipmentBonus: number
): number {
  return Math.min(ATTRIBUTE_SKILL_CAP, base + equipmentBonus);
}

/** Innate attribute dice: 1–5 after equipment, before armour agility/stealth penalty. */
export function capInnateAttributeDiceWithEquipment(
  base: number,
  equipmentBonus: number
): number {
  return Math.max(
    MIN_INNATE_ATTRIBUTE_DICE,
    Math.min(ATTRIBUTE_SKILL_CAP, base + equipmentBonus)
  );
}

/** Tooltip for carousel / title when equipment changes the stat. */
export function equipmentBonusTooltip(
  base: number,
  detail: EquipmentBonusDetail | undefined,
  wasCapped: boolean,
  wasFlooredAtMin = false
): string | undefined {
  if (!detail || detail.total === 0) return undefined;
  const src = detail.sources
    .map((s) => {
      const sign = s.amount >= 0 ? "+" : "";
      return `${s.label} (${sign}${s.amount})`;
    })
    .join(", ");
  const fromItems =
    detail.total < 0
      ? "Penalty from equipped items"
      : "Bonus from equipped items";
  let t = `Base ${base}. ${fromItems}: ${src}.`;
  if (wasCapped) {
    t += ` Shown value is capped at ${ATTRIBUTE_SKILL_CAP} (maximum for attributes and skills).`;
  }
  if (wasFlooredAtMin) {
    t += ` Shown value is at least ${MIN_INNATE_ATTRIBUTE_DICE} (minimum for attribute dice).`;
  }
  return t;
}
