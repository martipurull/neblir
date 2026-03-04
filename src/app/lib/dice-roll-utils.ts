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
  if (item.type === "attribute") {
    const group =
      character.innateAttributes[
        item.attributeGroup as keyof typeof character.innateAttributes
      ];
    if (group && typeof group === "object") {
      const val = (group as Record<string, number>)[item.skillKey];
      return typeof val === "number" ? val : 0;
    }
    return 0;
  }
  const gs = character.learnedSkills?.generalSkills;
  if (!gs) return 0;
  const val = (gs as Record<string, number>)[item.skillKey];
  return typeof val === "number" ? val : 0;
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
