/** One selected stat for a dice roll: an attribute sub-stat or a general skill */
export type DiceSelectionItem =
  | { type: "attribute"; attributeGroup: string; skillKey: string }
  | { type: "skill"; skillKey: string };

export function isSameDiceSelection(
  a: DiceSelectionItem,
  b: DiceSelectionItem
): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "attribute" && b.type === "attribute") {
    return a.attributeGroup === b.attributeGroup && a.skillKey === b.skillKey;
  }
  if (a.type === "skill" && b.type === "skill") {
    return a.skillKey === b.skillKey;
  }
  return false;
}
