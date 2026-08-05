/**
 * True when a next-session date exists and is before local midnight today.
 * Matches the comparison used on game hub / list cards for past sessions.
 */
export function isPastNextSessionDate(
  nextSession: Date | string | null | undefined
): boolean {
  if (nextSession == null) return false;
  const nextSessionDate = new Date(nextSession);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return nextSessionDate < today;
}
