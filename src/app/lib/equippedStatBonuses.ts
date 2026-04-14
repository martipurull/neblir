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

export function capAttributeOrSkill(
  base: number,
  equipmentBonus: number
): number {
  return Math.min(ATTRIBUTE_SKILL_CAP, base + equipmentBonus);
}

/** Tooltip for carousel / title when equipment changes the stat. */
export function equipmentBonusTooltip(
  base: number,
  detail: EquipmentBonusDetail | undefined,
  wasCapped: boolean
): string | undefined {
  if (!detail || detail.total === 0) return undefined;
  const src = detail.sources.map((s) => `${s.label} (+${s.amount})`).join(", ");
  let t = `Base ${base}. Bonus from equipped: ${src}.`;
  if (wasCapped) {
    t += ` Shown value is capped at ${ATTRIBUTE_SKILL_CAP} (maximum for attributes and skills).`;
  }
  return t;
}
