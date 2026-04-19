export const USES_DEBOUNCE_MS = 2500;

export const innerActionPanelClass =
  "rounded border border-white/20 bg-paleBlue/5 p-3 space-y-3";

export function fmtSignedBonus(n: number) {
  return n >= 0 ? `+${n}` : String(n);
}

export function rollDice(diceType: number): number {
  return Math.floor(Math.random() * diceType) + 1;
}
