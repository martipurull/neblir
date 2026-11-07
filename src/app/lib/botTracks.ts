/**
 * Bot attribute tracks and battery.
 * Bases and max potentials live on the template. Upgrades live on the holding.
 */

export const BOT_ATTRIBUTE_MIN = -5;
export const BOT_ATTRIBUTE_MAX = 5;
export const BOT_MAX_POTENTIAL_MIN = 0;
export const BOT_MAX_POTENTIAL_MAX = 5;
const BOT_UPGRADE_MIN = -5;
export const BOT_BATTERY_CAPACITY_MIN = 1;
export const BOT_BATTERY_CAPACITY_MAX = 10;

const BOT_TRACK_STAT_KEYS = [
  "processingPower",
  "processingPowerMaxPotential",
  "physicalPower",
  "physicalPowerMaxPotential",
  "finesseCapacity",
  "finesseCapacityMaxPotential",
  "gridProtection",
  "gridProtectionMaxPotential",
  "batteryCapacity",
  "batteryMaxPotential",
] as const;

export type BotTrackStatKey = (typeof BOT_TRACK_STAT_KEYS)[number];

export type BotTrackStats = Record<BotTrackStatKey, number>;

export const DEFAULT_BOT_TRACK_STATS: BotTrackStats = {
  processingPower: 0,
  processingPowerMaxPotential: 0,
  physicalPower: 0,
  physicalPowerMaxPotential: 0,
  finesseCapacity: 0,
  finesseCapacityMaxPotential: 0,
  gridProtection: 0,
  gridProtectionMaxPotential: 0,
  batteryCapacity: 1,
  batteryMaxPotential: 0,
};

export const BOT_TEMPLATE_TRACK_FIELDS: ReadonlyArray<{
  key: BotTrackStatKey;
  label: string;
  min: number;
  max: number;
}> = [
  {
    key: "processingPower",
    label: "Processing Power",
    min: BOT_ATTRIBUTE_MIN,
    max: BOT_ATTRIBUTE_MAX,
  },
  {
    key: "processingPowerMaxPotential",
    label: "Processing Power max potential",
    min: BOT_MAX_POTENTIAL_MIN,
    max: BOT_MAX_POTENTIAL_MAX,
  },
  {
    key: "physicalPower",
    label: "Physical Power",
    min: BOT_ATTRIBUTE_MIN,
    max: BOT_ATTRIBUTE_MAX,
  },
  {
    key: "physicalPowerMaxPotential",
    label: "Physical Power max potential",
    min: BOT_MAX_POTENTIAL_MIN,
    max: BOT_MAX_POTENTIAL_MAX,
  },
  {
    key: "finesseCapacity",
    label: "Finesse Capacity",
    min: BOT_ATTRIBUTE_MIN,
    max: BOT_ATTRIBUTE_MAX,
  },
  {
    key: "finesseCapacityMaxPotential",
    label: "Finesse Capacity max potential",
    min: BOT_MAX_POTENTIAL_MIN,
    max: BOT_MAX_POTENTIAL_MAX,
  },
  {
    key: "gridProtection",
    label: "Grid Protection",
    min: BOT_ATTRIBUTE_MIN,
    max: BOT_ATTRIBUTE_MAX,
  },
  {
    key: "gridProtectionMaxPotential",
    label: "Grid Protection max potential",
    min: BOT_MAX_POTENTIAL_MIN,
    max: BOT_MAX_POTENTIAL_MAX,
  },
  {
    key: "batteryCapacity",
    label: "Battery capacity",
    min: BOT_BATTERY_CAPACITY_MIN,
    max: BOT_BATTERY_CAPACITY_MAX,
  },
  {
    key: "batteryMaxPotential",
    label: "Battery max potential",
    min: BOT_MAX_POTENTIAL_MIN,
    max: BOT_MAX_POTENTIAL_MAX,
  },
];

type BotTrackOverrideKey = `${BotTrackStatKey}Override`;

export type BotTrackOverrides = Record<BotTrackOverrideKey, number | null>;

export const BOT_UPGRADE_TRACKS = [
  "processingPower",
  "physicalPower",
  "finesseCapacity",
  "gridProtection",
  "battery",
] as const;

export type BotUpgradeTrack = (typeof BOT_UPGRADE_TRACKS)[number];

export const BOT_UPGRADE_LABELS: Record<BotUpgradeTrack, string> = {
  processingPower: "Processing Power",
  physicalPower: "Physical Power",
  finesseCapacity: "Finesse Capacity",
  gridProtection: "Grid Protection",
  battery: "Battery",
};

const UPGRADE_FIELD = {
  processingPower: "processingPowerUpgrade",
  physicalPower: "physicalPowerUpgrade",
  finesseCapacity: "finesseCapacityUpgrade",
  gridProtection: "gridProtectionUpgrade",
  battery: "batteryUpgrade",
} as const;

export type BotHoldingTrackState = {
  processingPowerUpgrade: number;
  physicalPowerUpgrade: number;
  finesseCapacityUpgrade: number;
  gridProtectionUpgrade: number;
  batteryUpgrade: number;
  batteryUsed: number;
  isBeyondRepair: boolean;
};

export const BOT_UPGRADE_OUT_OF_RANGE_MESSAGE =
  "Upgrade must stay from -5 through that track's max potential.";

export const BOT_BATTERY_USED_OUT_OF_RANGE_MESSAGE =
  "Battery used must stay from 0 through the effective capacity.";

export type BotAttributeFigure = {
  base: number;
  maxPotential: number;
  upgrade: number;
  effective: number;
  /** Null when the Upgrade is 0, so the sheet shows the base alone. */
  signedUpgrade: string | null;
};

export type BotBatteryFigure = {
  base: number;
  maxPotential: number;
  upgrade: number;
  effectiveCapacity: number;
  signedUpgrade: string | null;
  used: number;
  remaining: number;
};

export type BotConditionName = "OPERATIONAL" | "BROKEN" | "BEYOND_REPAIR";

export type BotRollBlockReason = "BROKEN" | "BEYOND_REPAIR" | "BATTERY_EMPTY";

export function readBotTrackStats(
  source: Partial<BotTrackStats> | null | undefined
): BotTrackStats {
  return {
    processingPower:
      source?.processingPower ?? DEFAULT_BOT_TRACK_STATS.processingPower,
    processingPowerMaxPotential:
      source?.processingPowerMaxPotential ??
      DEFAULT_BOT_TRACK_STATS.processingPowerMaxPotential,
    physicalPower:
      source?.physicalPower ?? DEFAULT_BOT_TRACK_STATS.physicalPower,
    physicalPowerMaxPotential:
      source?.physicalPowerMaxPotential ??
      DEFAULT_BOT_TRACK_STATS.physicalPowerMaxPotential,
    finesseCapacity:
      source?.finesseCapacity ?? DEFAULT_BOT_TRACK_STATS.finesseCapacity,
    finesseCapacityMaxPotential:
      source?.finesseCapacityMaxPotential ??
      DEFAULT_BOT_TRACK_STATS.finesseCapacityMaxPotential,
    gridProtection:
      source?.gridProtection ?? DEFAULT_BOT_TRACK_STATS.gridProtection,
    gridProtectionMaxPotential:
      source?.gridProtectionMaxPotential ??
      DEFAULT_BOT_TRACK_STATS.gridProtectionMaxPotential,
    batteryCapacity:
      source?.batteryCapacity ?? DEFAULT_BOT_TRACK_STATS.batteryCapacity,
    batteryMaxPotential:
      source?.batteryMaxPotential ??
      DEFAULT_BOT_TRACK_STATS.batteryMaxPotential,
  };
}

export function pickDefinedTrackStats(
  source: Partial<BotTrackStats> | null | undefined
): Partial<BotTrackStats> {
  const picked: Partial<BotTrackStats> = {};
  if (source == null) return picked;
  for (const key of BOT_TRACK_STAT_KEYS) {
    const value = source[key];
    if (value !== undefined) picked[key] = value;
  }
  return picked;
}

export function readBotTrackOverrides(
  source: Partial<BotTrackOverrides> | null | undefined
): BotTrackOverrides {
  const overrides = {} as BotTrackOverrides;
  for (const key of BOT_TRACK_STAT_KEYS) {
    const overrideKey = `${key}Override` as BotTrackOverrideKey;
    const value = source?.[overrideKey];
    overrides[overrideKey] = typeof value === "number" ? value : null;
  }
  return overrides;
}

export function pickDefinedTrackOverrides(
  source: Partial<BotTrackOverrides> | null | undefined
): Partial<BotTrackOverrides> {
  const picked: Partial<BotTrackOverrides> = {};
  if (source == null) return picked;
  for (const key of BOT_TRACK_STAT_KEYS) {
    const overrideKey = `${key}Override` as BotTrackOverrideKey;
    if (source[overrideKey] !== undefined) {
      const value = source[overrideKey];
      picked[overrideKey] = typeof value === "number" ? value : null;
    }
  }
  return picked;
}

export function resolveBotTrackStats(
  overrides: Partial<BotTrackOverrides> | null | undefined,
  template: Partial<BotTrackStats> | null | undefined
): BotTrackStats {
  const resolved = readBotTrackStats(template);
  for (const key of BOT_TRACK_STAT_KEYS) {
    const overrideKey = `${key}Override` as BotTrackOverrideKey;
    const value = overrides?.[overrideKey];
    if (typeof value === "number") resolved[key] = value;
  }
  return resolved;
}

export function readHoldingTracks(
  row: Partial<BotHoldingTrackState> | null | undefined
): BotHoldingTrackState {
  return {
    processingPowerUpgrade: row?.processingPowerUpgrade ?? 0,
    physicalPowerUpgrade: row?.physicalPowerUpgrade ?? 0,
    finesseCapacityUpgrade: row?.finesseCapacityUpgrade ?? 0,
    gridProtectionUpgrade: row?.gridProtectionUpgrade ?? 0,
    batteryUpgrade: row?.batteryUpgrade ?? 0,
    batteryUsed: row?.batteryUsed ?? 0,
    isBeyondRepair: row?.isBeyondRepair ?? false,
  };
}

function maxPotentialForTrack(
  stats: BotTrackStats,
  track: BotUpgradeTrack
): number {
  if (track === "battery") return stats.batteryMaxPotential;
  const key = `${track}MaxPotential` as BotTrackStatKey;
  return stats[key];
}

function upgradeIsInRange(upgrade: number, maxPotential: number): boolean {
  return (
    Number.isInteger(upgrade) &&
    upgrade >= BOT_UPGRADE_MIN &&
    upgrade <= maxPotential
  );
}

export function effectiveBatteryCapacity(
  base: number,
  upgrade: number
): number {
  return Math.max(0, base + upgrade);
}

function batteryUsedWithinCapacity(used: number, capacity: number): number {
  return Math.min(Math.max(0, used), Math.max(0, capacity));
}

/** The next stored battery used, or null when the counter does not need to drop. */
export function batteryUsedDrop(
  used: number | null | undefined,
  upgrade: number | null | undefined,
  baseCapacity: number
): number | null {
  const current = used ?? 0;
  const next = batteryUsedWithinCapacity(
    current,
    effectiveBatteryCapacity(baseCapacity, upgrade ?? 0)
  );
  return next === current ? null : next;
}

function signedUpgrade(upgrade: number): string | null {
  if (upgrade === 0) return null;
  if (upgrade > 0) return `+${upgrade}`;
  return String(upgrade);
}

export function shownTrackFigure(
  base: number,
  effective: number,
  signed: string | null
): string {
  if (signed == null) return String(base);
  return `${effective} (${signed})`;
}

function presentAttribute(
  base: number,
  maxPotential: number,
  upgrade: number
): BotAttributeFigure {
  return {
    base,
    maxPotential,
    upgrade,
    effective: base + upgrade,
    signedUpgrade: signedUpgrade(upgrade),
  };
}

function presentBattery(
  base: number,
  maxPotential: number,
  upgrade: number,
  used: number
): BotBatteryFigure {
  const effectiveCapacity = effectiveBatteryCapacity(base, upgrade);
  const shownUsed = batteryUsedWithinCapacity(used, effectiveCapacity);
  return {
    base,
    maxPotential,
    upgrade,
    effectiveCapacity,
    signedUpgrade: signedUpgrade(upgrade),
    used: shownUsed,
    remaining: effectiveCapacity - shownUsed,
  };
}

function botCondition(
  isBeyondRepair: boolean,
  currentHp: number
): BotConditionName {
  if (isBeyondRepair) return "BEYOND_REPAIR";
  if (currentHp <= 0) return "BROKEN";
  return "OPERATIONAL";
}

function botRollPermission(
  condition: BotConditionName,
  batteryRemaining: number
): { mayRoll: boolean; rollBlockedReason: BotRollBlockReason | null } {
  if (condition === "BEYOND_REPAIR") {
    return { mayRoll: false, rollBlockedReason: "BEYOND_REPAIR" };
  }
  if (condition === "BROKEN") {
    return { mayRoll: false, rollBlockedReason: "BROKEN" };
  }
  if (batteryRemaining <= 0) {
    return { mayRoll: false, rollBlockedReason: "BATTERY_EMPTY" };
  }
  return { mayRoll: true, rollBlockedReason: null };
}

export function presentBotTracks(
  stats: Partial<BotTrackStats> | null | undefined,
  row: Partial<BotHoldingTrackState> | null | undefined,
  currentHp: number
): {
  attributes: Record<Exclude<BotUpgradeTrack, "battery">, BotAttributeFigure>;
  battery: BotBatteryFigure;
  isBeyondRepair: boolean;
  condition: BotConditionName;
  mayRoll: boolean;
  rollBlockedReason: BotRollBlockReason | null;
} {
  const template = readBotTrackStats(stats);
  const holding = readHoldingTracks(row);
  const battery = presentBattery(
    template.batteryCapacity,
    template.batteryMaxPotential,
    holding.batteryUpgrade,
    holding.batteryUsed
  );
  const condition = botCondition(holding.isBeyondRepair, currentHp);
  const roll = botRollPermission(condition, battery.remaining);
  return {
    attributes: {
      processingPower: presentAttribute(
        template.processingPower,
        template.processingPowerMaxPotential,
        holding.processingPowerUpgrade
      ),
      physicalPower: presentAttribute(
        template.physicalPower,
        template.physicalPowerMaxPotential,
        holding.physicalPowerUpgrade
      ),
      finesseCapacity: presentAttribute(
        template.finesseCapacity,
        template.finesseCapacityMaxPotential,
        holding.finesseCapacityUpgrade
      ),
      gridProtection: presentAttribute(
        template.gridProtection,
        template.gridProtectionMaxPotential,
        holding.gridProtectionUpgrade
      ),
    },
    battery,
    isBeyondRepair: holding.isBeyondRepair,
    condition,
    mayRoll: roll.mayRoll,
    rollBlockedReason: roll.rollBlockedReason,
  };
}

export function upgradeWrite(
  track: BotUpgradeTrack,
  upgrade: number,
  stats: Partial<BotTrackStats> | null | undefined,
  row: Partial<BotHoldingTrackState> | null | undefined
): { ok: true; data: Partial<BotHoldingTrackState> } | { ok: false } {
  const template = readBotTrackStats(stats);
  if (!upgradeIsInRange(upgrade, maxPotentialForTrack(template, track))) {
    return { ok: false };
  }
  if (track === "battery") {
    const capacity = effectiveBatteryCapacity(
      template.batteryCapacity,
      upgrade
    );
    return {
      ok: true,
      data: {
        batteryUpgrade: upgrade,
        batteryUsed: batteryUsedWithinCapacity(row?.batteryUsed ?? 0, capacity),
      },
    };
  }
  return {
    ok: true,
    data: { [UPGRADE_FIELD[track]]: upgrade },
  };
}

export function emptyTrackFieldText(): Record<BotTrackStatKey, string> {
  const text = {} as Record<BotTrackStatKey, string>;
  for (const key of BOT_TRACK_STAT_KEYS) text[key] = "";
  return text;
}

export function defaultTrackFieldText(): Record<BotTrackStatKey, string> {
  const text = {} as Record<BotTrackStatKey, string>;
  for (const key of BOT_TRACK_STAT_KEYS) {
    text[key] = String(DEFAULT_BOT_TRACK_STATS[key]);
  }
  return text;
}

export function trackFieldTextFromStats(
  stats: Partial<BotTrackStats> | null | undefined
): Record<BotTrackStatKey, string> {
  const resolved = readBotTrackStats(stats);
  const text = {} as Record<BotTrackStatKey, string>;
  for (const key of BOT_TRACK_STAT_KEYS) text[key] = String(resolved[key]);
  return text;
}

export function trackFieldTextFromOverrides(
  overrides: Partial<BotTrackOverrides> | null | undefined
): Record<BotTrackStatKey, string> {
  const text = emptyTrackFieldText();
  for (const key of BOT_TRACK_STAT_KEYS) {
    const value = overrides?.[`${key}Override`];
    text[key] = typeof value === "number" ? String(value) : "";
  }
  return text;
}

export function trackStatsFromFieldText(
  text: Record<BotTrackStatKey, string>
): Partial<BotTrackStats> {
  const stats: Partial<BotTrackStats> = {};
  for (const key of BOT_TRACK_STAT_KEYS) {
    const trimmed = text[key].trim();
    if (trimmed.length === 0) continue;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) stats[key] = parsed;
  }
  return stats;
}

export function trackOverridesFromFieldText(
  text: Record<BotTrackStatKey, string>
): Partial<BotTrackOverrides> {
  const overrides: Partial<BotTrackOverrides> = {};
  for (const key of BOT_TRACK_STAT_KEYS) {
    const overrideKey = `${key}Override` as BotTrackOverrideKey;
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
