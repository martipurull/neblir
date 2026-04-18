import type { CharacterDetail } from "@/app/lib/types/character";
import type { DiceSelectionItem } from "@/app/lib/types/dice-roll";
import { isSameDiceSelection } from "@/app/lib/types/dice-roll";
import { getDiceLabel } from "@/app/lib/dice-roll-utils";

/** Stable string for SelectDropdown / forms */
export function encodeDiceSelectionItem(item: DiceSelectionItem): string {
  return JSON.stringify(item);
}

export function decodeDiceSelectionItem(raw: string): DiceSelectionItem | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as DiceSelectionItem;
    if (v.type === "attribute" && v.attributeGroup && v.skillKey) return v;
    if (v.type === "skill" && v.skillKey) return v;
  } catch {
    /* ignore */
  }
  return null;
}

/** Every attribute sub-stat and general skill that can feed a dice roll */
export function listAllDiceSelectionItems(
  character: CharacterDetail
): DiceSelectionItem[] {
  const out: DiceSelectionItem[] = [];
  const attrs = character.innateAttributes;
  for (const groupKey of Object.keys(attrs) as Array<keyof typeof attrs>) {
    const group = attrs[groupKey];
    if (typeof group !== "object" || group === null) continue;
    for (const skillKey of Object.keys(group as Record<string, number>)) {
      out.push({
        type: "attribute",
        attributeGroup: groupKey as string,
        skillKey,
      });
    }
  }
  const gs = character.learnedSkills?.generalSkills;
  if (gs && typeof gs === "object") {
    for (const skillKey of Object.keys(gs as Record<string, number>)) {
      out.push({ type: "skill", skillKey });
    }
  }
  return out;
}

export function isValidDiceRollPair(
  a: DiceSelectionItem,
  b: DiceSelectionItem
): boolean {
  if (isSameDiceSelection(a, b)) return false;
  return !(a.type === "skill" && b.type === "skill");
}

export function filterSecondStatChoices(
  first: DiceSelectionItem,
  all: DiceSelectionItem[]
): DiceSelectionItem[] {
  return all.filter((item) => isValidDiceRollPair(first, item));
}

export function diceItemsToDropdownOptions(
  character: CharacterDetail,
  items: DiceSelectionItem[]
) {
  return items.map((item) => ({
    value: encodeDiceSelectionItem(item),
    label: getDiceLabel(character, item),
  }));
}
