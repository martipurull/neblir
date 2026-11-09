/**
 * Open-ended bot stats. The bound lives on the label because the field has no slider.
 * A template override keeps the template when the field is empty, so cargo and
 * installed drop the "empty means no cap" wording in that case.
 */

type OpenEndedStat = {
  name: string;
  detail: string;
  /** Parenthetical on a template override. `null` drops it. Omit to keep `detail`. */
  overrideDetail?: string | null;
};

const BOT_OPEN_ENDED_STATS = {
  maxHp: { name: "Max HP", detail: "1 or more" },
  speed: { name: "Speed", detail: "m, 0 or more" },
  maxCarry: { name: "Max carry", detail: "kg, 0 or more" },
  height: { name: "Height", detail: "m, optional, 0 or more" },
  weight: { name: "Weight", detail: "kg, optional, 0 or more" },
  cargo: {
    name: "Cargo max",
    detail: "kg, empty = no cap",
    overrideDetail: "kg",
  },
  installed: {
    name: "Installed max",
    detail: "empty = no cap",
    overrideDetail: null,
  },
} satisfies Record<string, OpenEndedStat>;

export type BotOpenEndedStatKey = keyof typeof BOT_OPEN_ENDED_STATS;

export function botOpenEndedStatLabel(
  key: BotOpenEndedStatKey,
  options?: { override?: boolean }
): string {
  const stat = BOT_OPEN_ENDED_STATS[key];
  if (!(options?.override ?? false)) {
    return `${stat.name} (${stat.detail})`;
  }
  const name = `${stat.name} override`;
  const detail = "overrideDetail" in stat ? stat.overrideDetail : stat.detail;
  if (detail == null) return name;
  return `${name} (${detail})`;
}
