/**
 * Authored bot attacks, defences, and the Reaction cap.
 * Bases live on the template. A unique bot may override each one.
 * Remaining Reactions live on the holding.
 */

export const BOT_COMBAT_VALUE_MIN = 1;
export const BOT_COMBAT_VALUE_MAX = 5;
export const DEFAULT_BOT_REACTION_CAP = 2;

export const BOT_COMBAT_VALUES = [
  "attackMelee",
  "attackRange",
  "defenceMelee",
  "defenceRange",
  "defenceGrid",
] as const;

export type BotCombatValue = (typeof BOT_COMBAT_VALUES)[number];

const BOT_COMBAT_STAT_KEYS = [
  ...BOT_COMBAT_VALUES,
  "numberOfReactions",
] as const;

export type BotCombatStatKey = (typeof BOT_COMBAT_STAT_KEYS)[number];

export type BotCombatStats = Record<BotCombatStatKey, number>;

export const DEFAULT_BOT_COMBAT_STATS: BotCombatStats = {
  attackMelee: 1,
  attackRange: 1,
  defenceMelee: 1,
  defenceRange: 1,
  defenceGrid: 1,
  numberOfReactions: DEFAULT_BOT_REACTION_CAP,
};

export const BOT_COMBAT_LABELS: Record<BotCombatValue, string> = {
  attackMelee: "Attack Melee",
  attackRange: "Attack Range",
  defenceMelee: "Defence Melee",
  defenceRange: "Defence Range",
  defenceGrid: "Defence GRID",
};

export const BOT_REACTION_CAP_NAME = "Bot reaction cap";

/** Open-ended reaction cap. There is no maximum; 2 is the usual cap. */
export function botReactionCapLabel(name = BOT_REACTION_CAP_NAME): string {
  return `${name} (no upper limit, usual cap is 2)`;
}

export const BOT_COMBAT_FIELDS: ReadonlyArray<{
  key: BotCombatStatKey;
  label: string;
  min: number;
  max?: number;
}> = [
  {
    key: "attackMelee",
    label: "Attack Melee",
    min: BOT_COMBAT_VALUE_MIN,
    max: BOT_COMBAT_VALUE_MAX,
  },
  {
    key: "attackRange",
    label: "Attack Range",
    min: BOT_COMBAT_VALUE_MIN,
    max: BOT_COMBAT_VALUE_MAX,
  },
  {
    key: "defenceMelee",
    label: "Defence Melee",
    min: BOT_COMBAT_VALUE_MIN,
    max: BOT_COMBAT_VALUE_MAX,
  },
  {
    key: "defenceRange",
    label: "Defence Range",
    min: BOT_COMBAT_VALUE_MIN,
    max: BOT_COMBAT_VALUE_MAX,
  },
  {
    key: "defenceGrid",
    label: "Defence GRID",
    min: BOT_COMBAT_VALUE_MIN,
    max: BOT_COMBAT_VALUE_MAX,
  },
  {
    key: "numberOfReactions",
    label: "Reactions",
    min: 0,
  },
];

type BotCombatOverrideKey = `${BotCombatStatKey}Override`;

export type BotCombatOverrides = Record<BotCombatOverrideKey, number | null>;

export type BotAttack = "attackMelee" | "attackRange";

export type BotDefence = "defenceMelee" | "defenceRange" | "defenceGrid";

const BOT_COMBAT_VALUE_SET = new Set<string>(BOT_COMBAT_VALUES);

export function isBotCombatValue(value: string): value is BotCombatValue {
  return BOT_COMBAT_VALUE_SET.has(value);
}

export function isBotAttack(value: BotCombatValue): value is BotAttack {
  return value === "attackMelee" || value === "attackRange";
}

export function readBotCombatStats(
  source: Partial<BotCombatStats> | null | undefined
): BotCombatStats {
  return {
    attackMelee: source?.attackMelee ?? DEFAULT_BOT_COMBAT_STATS.attackMelee,
    attackRange: source?.attackRange ?? DEFAULT_BOT_COMBAT_STATS.attackRange,
    defenceMelee: source?.defenceMelee ?? DEFAULT_BOT_COMBAT_STATS.defenceMelee,
    defenceRange: source?.defenceRange ?? DEFAULT_BOT_COMBAT_STATS.defenceRange,
    defenceGrid: source?.defenceGrid ?? DEFAULT_BOT_COMBAT_STATS.defenceGrid,
    numberOfReactions:
      source?.numberOfReactions ?? DEFAULT_BOT_COMBAT_STATS.numberOfReactions,
  };
}

export function pickDefinedCombatStats(
  source: Partial<BotCombatStats> | null | undefined
): Partial<BotCombatStats> {
  const picked: Partial<BotCombatStats> = {};
  if (source == null) return picked;
  for (const key of BOT_COMBAT_STAT_KEYS) {
    const value = source[key];
    if (value !== undefined) picked[key] = value;
  }
  return picked;
}

export function readBotCombatOverrides(
  source: Partial<BotCombatOverrides> | null | undefined
): BotCombatOverrides {
  const overrides = {} as BotCombatOverrides;
  for (const key of BOT_COMBAT_STAT_KEYS) {
    const overrideKey = `${key}Override` as BotCombatOverrideKey;
    const value = source?.[overrideKey];
    overrides[overrideKey] = typeof value === "number" ? value : null;
  }
  return overrides;
}

export function pickDefinedCombatOverrides(
  source: Partial<BotCombatOverrides> | null | undefined
): Partial<BotCombatOverrides> {
  const picked: Partial<BotCombatOverrides> = {};
  if (source == null) return picked;
  for (const key of BOT_COMBAT_STAT_KEYS) {
    const overrideKey = `${key}Override` as BotCombatOverrideKey;
    if (source[overrideKey] !== undefined) {
      const value = source[overrideKey];
      picked[overrideKey] = typeof value === "number" ? value : null;
    }
  }
  return picked;
}

export function resolveBotCombatStats(
  overrides: Partial<BotCombatOverrides> | null | undefined,
  template: Partial<BotCombatStats> | null | undefined
): BotCombatStats {
  const resolved = readBotCombatStats(template);
  for (const key of BOT_COMBAT_STAT_KEYS) {
    const overrideKey = `${key}Override` as BotCombatOverrideKey;
    const value = overrides?.[overrideKey];
    if (typeof value === "number") resolved[key] = value;
  }
  return resolved;
}

/** Remaining cannot rise with the cap. A lower cap pulls it down. */
export function reactionsRemainingForCap(
  remaining: number | null | undefined,
  cap: number
): number {
  const stored = remaining ?? DEFAULT_BOT_REACTION_CAP;
  return Math.min(stored, cap);
}

/** Pool before extra dice. At least 1. */
function botCombatPool(parts: number[]): number {
  return Math.max(
    1,
    parts.reduce((sum, part) => sum + part, 0)
  );
}

type AttributeFigures = {
  physicalPower: { effective: number };
  finesseCapacity: { effective: number };
  gridProtection: { effective: number };
};

function botAttackAttribute(
  attack: BotAttack,
  attributes: AttributeFigures
): number {
  return attack === "attackMelee"
    ? attributes.physicalPower.effective
    : attributes.finesseCapacity.effective;
}

function botDefenceAttribute(
  defence: BotDefence,
  attributes: AttributeFigures
): number {
  if (defence === "defenceMelee") return attributes.physicalPower.effective;
  if (defence === "defenceRange") return attributes.finesseCapacity.effective;
  return attributes.gridProtection.effective;
}

export function botAttackPool(
  stats: BotCombatStats,
  attributes: AttributeFigures,
  attack: BotAttack,
  weaponBonus: number
): number {
  return botCombatPool([
    stats[attack],
    botAttackAttribute(attack, attributes),
    weaponBonus,
  ]);
}

export function botDefencePool(
  stats: BotCombatStats,
  attributes: AttributeFigures,
  defence: BotDefence
): number {
  return botCombatPool([
    stats[defence],
    botDefenceAttribute(defence, attributes),
  ]);
}

const UNARMED_DAMAGE = {
  numberOfDice: 1,
  diceType: 4,
  damageText: "1d4, bludgeoning",
};

type BotWeaponDamage = {
  numberOfDice: number;
  diceType: number;
  damageText: string;
};

export type BotAttackChoice = {
  /** Absent for Unarmed and Improvised weapon. */
  itemCharacterId?: string;
  name: string;
  bonus: number;
  damage: BotWeaponDamage;
};

type OfferItem = {
  itemCharacterId: string;
  customName?: string | null;
  status?: string | null;
  currentUses?: number | null;
  botEquipSlots?: readonly string[] | null;
  item?: {
    name?: string | null;
    attackRoll?: readonly string[] | null;
    attackMeleeBonus?: number | null;
    attackRangeBonus?: number | null;
    maxUses?: number | null;
    damage?: {
      numberOfDice?: number | null;
      diceType?: number | null;
      damageType?: readonly string[] | null;
    } | null;
  } | null;
};

function formatWeaponDamage(damage: {
  numberOfDice?: number | null;
  diceType?: number | null;
  damageType?: readonly string[] | null;
}): BotWeaponDamage | null {
  if (
    !damage.damageType?.length ||
    damage.numberOfDice == null ||
    damage.diceType == null
  ) {
    return null;
  }
  const types = damage.damageType.map((type) => type.toLowerCase()).join(", ");
  return {
    numberOfDice: damage.numberOfDice,
    diceType: damage.diceType,
    damageText: `${damage.numberOfDice}d${damage.diceType}, ${types}`,
  };
}

function attackMode(attack: BotAttack): "MELEE" | "RANGE" {
  return attack === "attackMelee" ? "MELEE" : "RANGE";
}

/** Hand weapons of that attack mode, then Unarmed or Improvised weapon. */
export function botAttackChoices(
  attack: BotAttack,
  items: readonly OfferItem[]
): BotAttackChoice[] {
  const open: BotAttackChoice =
    attack === "attackMelee"
      ? { name: "Unarmed", bonus: 0, damage: UNARMED_DAMAGE }
      : { name: "Improvised weapon", bonus: 0, damage: UNARMED_DAMAGE };
  const weapons: BotAttackChoice[] = [];
  const mode = attackMode(attack);
  for (const entry of items) {
    if (!(entry.botEquipSlots ?? []).includes("HAND")) continue;
    if (entry.status != null && entry.status !== "FUNCTIONAL") continue;
    const item = entry.item;
    if (!item) continue;
    const maxUses = item.maxUses ?? null;
    if (maxUses != null && (entry.currentUses ?? 0) <= 0) continue;
    if (!(item.attackRoll ?? []).includes(mode)) continue;
    const bonus =
      attack === "attackMelee"
        ? (item.attackMeleeBonus ?? 0)
        : (item.attackRangeBonus ?? 0);
    const damage = item.damage ? formatWeaponDamage(item.damage) : null;
    weapons.push({
      itemCharacterId: entry.itemCharacterId,
      name: entry.customName?.trim() ?? item.name?.trim() ?? "Weapon",
      bonus,
      damage: damage ?? { numberOfDice: 0, diceType: 4, damageText: "" },
    });
  }
  return [...weapons, open];
}

export function emptyCombatFieldText(): Record<BotCombatStatKey, string> {
  const text = {} as Record<BotCombatStatKey, string>;
  for (const key of BOT_COMBAT_STAT_KEYS) text[key] = "";
  return text;
}

export function defaultCombatFieldText(): Record<BotCombatStatKey, string> {
  const text = {} as Record<BotCombatStatKey, string>;
  for (const key of BOT_COMBAT_STAT_KEYS) {
    text[key] = String(DEFAULT_BOT_COMBAT_STATS[key]);
  }
  return text;
}

export function combatFieldTextFromStats(
  stats: Partial<BotCombatStats> | null | undefined
): Record<BotCombatStatKey, string> {
  const resolved = readBotCombatStats(stats);
  const text = {} as Record<BotCombatStatKey, string>;
  for (const key of BOT_COMBAT_STAT_KEYS) text[key] = String(resolved[key]);
  return text;
}

export function combatFieldTextFromOverrides(
  overrides: Partial<BotCombatOverrides> | null | undefined
): Record<BotCombatStatKey, string> {
  const text = emptyCombatFieldText();
  for (const key of BOT_COMBAT_STAT_KEYS) {
    const value = overrides?.[`${key}Override`];
    text[key] = typeof value === "number" ? String(value) : "";
  }
  return text;
}

export function combatStatsFromFieldText(
  text: Record<BotCombatStatKey, string>
): Partial<BotCombatStats> {
  const stats: Partial<BotCombatStats> = {};
  for (const key of BOT_COMBAT_STAT_KEYS) {
    const trimmed = text[key].trim();
    if (trimmed.length === 0) continue;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) stats[key] = parsed;
  }
  return stats;
}

export function combatOverridesFromFieldText(
  text: Record<BotCombatStatKey, string>
): Partial<BotCombatOverrides> {
  const overrides: Partial<BotCombatOverrides> = {};
  for (const key of BOT_COMBAT_STAT_KEYS) {
    const overrideKey = `${key}Override` as BotCombatOverrideKey;
    const trimmed = text[key].trim();
    if (trimmed.length === 0) {
      overrides[overrideKey] = null;
      continue;
    }
    const parsed = Number(trimmed);
    overrides[overrideKey] = Number.isFinite(parsed) ? parsed : null;
  }
  return overrides;
}
