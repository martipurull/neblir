export type InitiativeCombatantRef = {
  combatantType: "CHARACTER" | "ENEMY" | "BOT";
  combatantId: string;
};

/** `TYPE:id`. The id may itself contain colons. */
export function parseCombatantRef(raw: string): InitiativeCombatantRef | null {
  const [maybeType, ...rest] = raw.split(":");
  if (
    (maybeType === "CHARACTER" ||
      maybeType === "ENEMY" ||
      maybeType === "BOT") &&
    rest.length > 0
  ) {
    return { combatantType: maybeType, combatantId: rest.join(":") };
  }
  return null;
}
