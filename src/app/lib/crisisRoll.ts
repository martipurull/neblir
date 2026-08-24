export const CRISIS_SUCCESS_MIN = 8;

export function crisisDicePoolSize(
  attributeScore: number,
  penalty: number
): number {
  return Math.max(1, attributeScore - penalty);
}

export function deathRollDicePoolSize(
  resilience: number,
  stamina: number,
  seriousPhysicalInjuries: number
): number {
  return crisisDicePoolSize(
    Math.max(resilience, stamina),
    seriousPhysicalInjuries
  );
}

export function madnessRollDicePoolSize(
  mentality: number,
  seriousTrauma: number
): number {
  return crisisDicePoolSize(mentality, seriousTrauma);
}

/** Any die 8–10 marks the box a success; otherwise a failure. */
export function crisisPoolIsSuccess(dice: readonly number[]): boolean {
  return dice.some((die) => die >= CRISIS_SUCCESS_MIN);
}
