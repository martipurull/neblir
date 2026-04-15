import {
  applyArmourPenaltyToInnateAttributeDice,
  getArmourAttributePenalty,
} from "@/app/lib/carryWeightUtils";
import {
  capAttributeOrSkill,
  getEquippedItemStatBonusDetails,
} from "@/app/lib/equippedStatBonuses";
import type { CharacterDetail } from "@/app/lib/types/character";
import type { DiceSelectionItem } from "@/app/lib/types/dice-roll";

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Dice value (1–5 for attributes, 0–5 for general skills) for the given selection */
export function getDiceValue(
  character: CharacterDetail,
  item: DiceSelectionItem
): number {
  const equip = getEquippedItemStatBonusDetails(character);

  if (item.type === "attribute") {
    const group =
      character.innateAttributes[
        item.attributeGroup as keyof typeof character.innateAttributes
      ];
    const base =
      group && typeof group === "object"
        ? ((group as Record<string, number>)[item.skillKey] ?? 0)
        : 0;
    const path = `${item.attributeGroup}.${item.skillKey}`;
    const bonus = equip.byAttributePath.get(path)?.total ?? 0;
    let v = capAttributeOrSkill(base, bonus);
    const armourMod = character.combatInformation?.armourMod ?? 0;
    const armourPenalty = getArmourAttributePenalty(armourMod);
    if (
      item.attributeGroup === "dexterity" &&
      (item.skillKey === "agility" || item.skillKey === "stealth") &&
      armourPenalty > 0
    ) {
      v = applyArmourPenaltyToInnateAttributeDice(v, armourPenalty);
    }
    return v;
  }
  const gs = character.learnedSkills?.generalSkills;
  if (!gs) return 0;
  const base = (gs as Record<string, number>)[item.skillKey] ?? 0;
  const bonus = equip.bySkill.get(item.skillKey)?.total ?? 0;
  return capAttributeOrSkill(typeof base === "number" ? base : 0, bonus);
}

/** Human-readable label for the selected stat */
export function getDiceLabel(
  character: CharacterDetail,
  item: DiceSelectionItem
): string {
  if (item.type === "attribute") {
    return `${formatLabel(item.attributeGroup)} (${formatLabel(item.skillKey)})`;
  }
  return formatLabel(item.skillKey);
}
