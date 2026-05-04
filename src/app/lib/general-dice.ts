/** Options for the “advanced” NdX dice dropdown (shared by GM + character free roll). */
export const COMMON_DICE_OPTIONS = [
  { value: "d4", label: "d4" },
  { value: "d6", label: "d6" },
  { value: "d8", label: "d8" },
  { value: "d10", label: "d10" },
  { value: "d20", label: "d20" },
  { value: "d100", label: "d100" },
  { value: "custom", label: "Any sides (custom)" },
] as const;

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/** Parse dropdown values like `"d10"` into sides; `"custom"` is not handled here. */
export function getSidesFromDieOption(value: string): number | null {
  if (!value.startsWith("d")) return null;
  const parsed = Number.parseInt(value.slice(1), 10);
  if (!Number.isInteger(parsed) || parsed < 2) return null;
  return parsed;
}
