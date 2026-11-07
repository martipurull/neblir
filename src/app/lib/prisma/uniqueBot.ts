import { readBotActionList, readBotActionOverride } from "@/app/lib/botActions";
import type { BotTemplateView } from "@/app/lib/botHoldingView";
import {
  pickDefinedCombatOverrides,
  readBotCombatOverrides,
  readBotCombatStats,
  resolveBotCombatStats,
  type BotCombatOverrides,
  type BotCombatStats,
} from "@/app/lib/botCombat";
import {
  pickDefinedTrackOverrides,
  readBotTrackOverrides,
  readBotTrackStats,
  resolveBotTrackStats,
  type BotTrackOverrides,
  type BotTrackStats,
} from "@/app/lib/botTracks";
import type {
  BotTemplateSourceType,
  UniqueBotCreate,
  UniqueBotListItem,
  UniqueBotRecord,
  UniqueBotUpdate,
} from "@/app/lib/types/bot";
import { getBot, getBotsByIds } from "./bot";
import { getCustomBot, getCustomBotsByIds } from "./customBot";
import { prisma } from "./client";

type UniqueBotRow = {
  id: string;
  ownerUserId: string;
  gameId: string;
  sourceType: BotTemplateSourceType;
  botId: string | null;
  nameOverride: string | null;
  imageKeyOverride: string | null;
  descriptionOverride: string | null;
  confCostOverride: number | null;
  usageOverride: string | null;
  notesOverride: string | null;
  maxHpOverride: number | null;
  maxCargoWeightKgOverride: number | null;
  maxInstalledItemsOverride: number | null;
  speedOverride?: number | null;
  maxCarryWeightOverride?: number | null;
  heightMetresOverride?: number | null;
  weightOverride?: number | null;
  actionsOverride?: unknown;
  additionalActionsOverride?: unknown;
} & Partial<BotTrackOverrides> &
  Partial<BotCombatOverrides>;

type UniqueBotWriteData = Omit<UniqueBotRow, "id">;

type TemplateStats = {
  id: string;
  name: string;
  imageKey?: string | null;
  description?: string | null;
  confCost?: number | null;
  usage?: string | null;
  notes?: string | null;
  maxHp: number;
  maxCargoWeightKg?: number | null;
  maxInstalledItems?: number | null;
  speed?: number | null;
  maxCarryWeight?: number | null;
  heightMetres?: number | null;
  weight?: number | null;
  actions?: unknown;
  additionalActions?: unknown;
} & Partial<BotTrackStats> &
  Partial<BotCombatStats>;

const uniqueBotPrisma = prisma as typeof prisma & {
  uniqueBot: {
    create(args: { data: UniqueBotWriteData }): Promise<UniqueBotRow>;
    findUnique(args: { where: { id: string } }): Promise<UniqueBotRow | null>;
    findMany(args: {
      where:
        | { gameId: string }
        | { id: { in: string[] } }
        | { sourceType: "OFFICIAL" | "CUSTOM"; botId: string };
    }): Promise<UniqueBotRow[]>;
    update(args: {
      where: { id: string };
      data: Partial<UniqueBotWriteData>;
    }): Promise<UniqueBotRow>;
  };
  botCharacter: {
    findMany(args: {
      where: { botId: { in: string[] }; sourceType: "UNIQUE" };
      select: { botId: true };
    }): Promise<Array<{ botId: string }>>;
  };
};

function blankToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function firstNonBlank(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim() ?? "";
    if (trimmed.length > 0) return trimmed;
  }
  return "";
}

function mapRecord(
  row: UniqueBotRow,
  templateName: string | null
): UniqueBotRecord {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    gameId: row.gameId,
    sourceType: row.sourceType,
    botId: row.botId,
    nameOverride: row.nameOverride,
    imageKeyOverride: row.imageKeyOverride,
    descriptionOverride: row.descriptionOverride,
    confCostOverride: row.confCostOverride,
    usageOverride: row.usageOverride,
    notesOverride: row.notesOverride,
    maxHpOverride: row.maxHpOverride,
    maxCargoWeightKgOverride: row.maxCargoWeightKgOverride,
    maxInstalledItemsOverride: row.maxInstalledItemsOverride,
    speedOverride: row.speedOverride ?? null,
    maxCarryWeightOverride: row.maxCarryWeightOverride ?? null,
    heightMetresOverride: row.heightMetresOverride ?? null,
    weightOverride: row.weightOverride ?? null,
    ...readBotTrackOverrides(row),
    ...readBotCombatOverrides(row),
    actionsOverride: readBotActionOverride(row.actionsOverride),
    additionalActionsOverride: readBotActionOverride(
      row.additionalActionsOverride
    ),
    templateName,
  };
}

export function uniqueBotCreateDataFromParsed(
  ownerUserId: string,
  parsed: UniqueBotCreate
): UniqueBotWriteData {
  const shared = {
    ownerUserId,
    gameId: parsed.gameId,
    nameOverride: blankToNull(parsed.nameOverride),
    imageKeyOverride: blankToNull(parsed.imageKeyOverride),
    descriptionOverride: blankToNull(parsed.descriptionOverride),
    confCostOverride: parsed.confCostOverride ?? null,
    usageOverride: blankToNull(parsed.usageOverride),
    notesOverride: blankToNull(parsed.notesOverride),
    maxHpOverride: parsed.maxHpOverride ?? null,
    maxCargoWeightKgOverride: parsed.maxCargoWeightKgOverride ?? null,
    maxInstalledItemsOverride: parsed.maxInstalledItemsOverride ?? null,
    speedOverride: parsed.speedOverride ?? null,
    maxCarryWeightOverride: parsed.maxCarryWeightOverride ?? null,
    heightMetresOverride: parsed.heightMetresOverride ?? null,
    weightOverride: parsed.weightOverride ?? null,
    ...readBotTrackOverrides(parsed),
    ...readBotCombatOverrides(parsed),
  };
  if (parsed.sourceType === "STANDALONE") {
    return {
      ...shared,
      sourceType: "STANDALONE",
      botId: null,
      actionsOverride: parsed.actionsOverride ?? [],
      additionalActionsOverride: parsed.additionalActionsOverride ?? [],
    };
  }
  return {
    ...shared,
    sourceType: parsed.sourceType,
    botId: parsed.botId,
    actionsOverride: parsed.actionsOverride ?? null,
    additionalActionsOverride: parsed.additionalActionsOverride ?? null,
  };
}

function updateData(parsed: UniqueBotUpdate): Partial<UniqueBotWriteData> {
  return {
    ...(parsed.nameOverride !== undefined
      ? { nameOverride: blankToNull(parsed.nameOverride) }
      : {}),
    ...(parsed.imageKeyOverride !== undefined
      ? { imageKeyOverride: blankToNull(parsed.imageKeyOverride) }
      : {}),
    ...(parsed.descriptionOverride !== undefined
      ? { descriptionOverride: blankToNull(parsed.descriptionOverride) }
      : {}),
    ...(parsed.confCostOverride !== undefined
      ? { confCostOverride: parsed.confCostOverride ?? null }
      : {}),
    ...(parsed.usageOverride !== undefined
      ? { usageOverride: blankToNull(parsed.usageOverride) }
      : {}),
    ...(parsed.notesOverride !== undefined
      ? { notesOverride: blankToNull(parsed.notesOverride) }
      : {}),
    ...(parsed.maxHpOverride !== undefined
      ? { maxHpOverride: parsed.maxHpOverride ?? null }
      : {}),
    ...(parsed.maxCargoWeightKgOverride !== undefined
      ? { maxCargoWeightKgOverride: parsed.maxCargoWeightKgOverride ?? null }
      : {}),
    ...(parsed.maxInstalledItemsOverride !== undefined
      ? {
          maxInstalledItemsOverride: parsed.maxInstalledItemsOverride ?? null,
        }
      : {}),
    ...(parsed.speedOverride !== undefined
      ? { speedOverride: parsed.speedOverride ?? null }
      : {}),
    ...(parsed.maxCarryWeightOverride !== undefined
      ? { maxCarryWeightOverride: parsed.maxCarryWeightOverride ?? null }
      : {}),
    ...(parsed.heightMetresOverride !== undefined
      ? { heightMetresOverride: parsed.heightMetresOverride ?? null }
      : {}),
    ...(parsed.weightOverride !== undefined
      ? { weightOverride: parsed.weightOverride ?? null }
      : {}),
    ...pickDefinedTrackOverrides(parsed),
    ...pickDefinedCombatOverrides(parsed),
    ...(parsed.actionsOverride !== undefined
      ? { actionsOverride: parsed.actionsOverride }
      : {}),
    ...(parsed.additionalActionsOverride !== undefined
      ? { additionalActionsOverride: parsed.additionalActionsOverride }
      : {}),
  };
}

export function resolveUniqueBotStats(
  row: {
    id: string;
    gameId: string;
    ownerUserId: string;
    nameOverride?: string | null;
    imageKeyOverride?: string | null;
    descriptionOverride?: string | null;
    confCostOverride?: number | null;
    usageOverride?: string | null;
    notesOverride?: string | null;
    maxHpOverride?: number | null;
    maxCargoWeightKgOverride?: number | null;
    maxInstalledItemsOverride?: number | null;
    speedOverride?: number | null;
    maxCarryWeightOverride?: number | null;
    heightMetresOverride?: number | null;
    weightOverride?: number | null;
    actionsOverride?: unknown;
    additionalActionsOverride?: unknown;
  } & Partial<BotTrackOverrides> &
    Partial<BotCombatOverrides>,
  template: TemplateStats | null
): BotTemplateView {
  const resolvedName = firstNonBlank(row.nameOverride, template?.name);
  return {
    id: row.id,
    name: resolvedName.length > 0 ? resolvedName : "Unknown bot",
    imageKey: row.imageKeyOverride ?? template?.imageKey ?? null,
    description: row.descriptionOverride ?? template?.description ?? null,
    confCost: row.confCostOverride ?? template?.confCost ?? null,
    usage: row.usageOverride ?? template?.usage ?? null,
    notes: row.notesOverride ?? template?.notes ?? null,
    maxHp: row.maxHpOverride ?? template?.maxHp ?? 0,
    maxCargoWeightKg:
      row.maxCargoWeightKgOverride ?? template?.maxCargoWeightKg ?? null,
    maxInstalledItems:
      row.maxInstalledItemsOverride ?? template?.maxInstalledItems ?? null,
    speed: row.speedOverride ?? template?.speed ?? 0,
    maxCarryWeight: row.maxCarryWeightOverride ?? template?.maxCarryWeight ?? 0,
    heightMetres: row.heightMetresOverride ?? template?.heightMetres ?? null,
    weight: row.weightOverride ?? template?.weight ?? null,
    ...resolveBotTrackStats(row, template),
    ...resolveBotCombatStats(row, template),
    actions:
      readBotActionOverride(row.actionsOverride) ??
      readBotActionList(template?.actions),
    additionalActions:
      readBotActionOverride(row.additionalActionsOverride) ??
      readBotActionList(template?.additionalActions),
    gameId: row.gameId,
    ownerUserId: row.ownerUserId,
  };
}

async function templateForRow(
  row: UniqueBotRow
): Promise<TemplateStats | null> {
  if (row.sourceType === "OFFICIAL" && row.botId) {
    const official = await getBot(row.botId);
    if (!official) return null;
    return {
      id: official.id,
      name: official.name,
      imageKey: official.imageKey ?? null,
      description: official.description,
      confCost: official.confCost,
      usage: official.usage ?? null,
      notes: official.notes ?? null,
      maxHp: official.maxHp,
      maxCargoWeightKg: official.maxCargoWeightKg ?? null,
      maxInstalledItems: official.maxInstalledItems ?? null,
      speed: official.speed ?? 0,
      maxCarryWeight: official.maxCarryWeight ?? 0,
      heightMetres: official.heightMetres ?? null,
      weight: official.weight ?? null,
      ...readBotTrackStats(official),
      ...readBotCombatStats(official),
      actions: official.actions,
      additionalActions: official.additionalActions,
    };
  }
  if (row.sourceType === "CUSTOM" && row.botId) {
    const custom = await getCustomBot(row.botId);
    return custom
      ? {
          id: custom.id,
          name: custom.name,
          description: custom.description,
          confCost: custom.confCost,
          usage: custom.usage,
          notes: custom.notes,
          maxHp: custom.maxHp,
          maxCargoWeightKg: custom.maxCargoWeightKg,
          maxInstalledItems: custom.maxInstalledItems,
          speed: custom.speed,
          maxCarryWeight: custom.maxCarryWeight,
          heightMetres: custom.heightMetres,
          weight: custom.weight,
          ...readBotTrackStats(custom),
          ...readBotCombatStats(custom),
          actions: custom.actions,
          additionalActions: custom.additionalActions,
        }
      : null;
  }
  return null;
}

async function templateNameForRow(row: UniqueBotRow): Promise<string | null> {
  const template = await templateForRow(row);
  return template?.name ?? null;
}

export async function getUniqueBot(
  id: string
): Promise<UniqueBotRecord | null> {
  const row = await uniqueBotPrisma.uniqueBot.findUnique({ where: { id } });
  if (!row) return null;
  return mapRecord(row, await templateNameForRow(row));
}

export async function getUniqueBotRow(
  id: string
): Promise<UniqueBotRow | null> {
  return uniqueBotPrisma.uniqueBot.findUnique({ where: { id } });
}

export async function listUniqueBotsForTemplate(
  sourceType: "OFFICIAL" | "CUSTOM",
  templateId: string
): Promise<UniqueBotRow[]> {
  return uniqueBotPrisma.uniqueBot.findMany({
    where: { sourceType, botId: templateId },
  });
}

export async function resolveUniqueBotTemplate(
  id: string
): Promise<BotTemplateView | null> {
  const row = await getUniqueBotRow(id);
  if (!row) return null;
  return resolveUniqueBotStats(row, await templateForRow(row));
}

export async function getResolvedUniqueBotsByIds(
  ids: string[]
): Promise<BotTemplateView[]> {
  if (ids.length === 0) return [];
  const rows = await uniqueBotPrisma.uniqueBot.findMany({
    where: { id: { in: ids } },
  });
  const officialIds = [
    ...new Set(
      rows
        .filter((row) => row.sourceType === "OFFICIAL" && row.botId)
        .map((row) => row.botId as string)
    ),
  ];
  const customIds = [
    ...new Set(
      rows
        .filter((row) => row.sourceType === "CUSTOM" && row.botId)
        .map((row) => row.botId as string)
    ),
  ];
  const [official, custom] = await Promise.all([
    officialIds.length > 0 ? getBotsByIds(officialIds) : Promise.resolve([]),
    customIds.length > 0 ? getCustomBotsByIds(customIds) : Promise.resolve([]),
  ]);
  const officialById = new Map(official.map((bot) => [bot.id, bot]));
  const customById = new Map(custom.map((bot) => [bot.id, bot]));
  return rows.map((row) => {
    const template =
      row.sourceType === "OFFICIAL" && row.botId
        ? (officialById.get(row.botId) ?? null)
        : row.sourceType === "CUSTOM" && row.botId
          ? (customById.get(row.botId) ?? null)
          : null;
    return resolveUniqueBotStats(row, template);
  });
}

export async function createUniqueBot(
  data: UniqueBotWriteData
): Promise<UniqueBotRecord> {
  const row = await uniqueBotPrisma.uniqueBot.create({ data });
  return mapRecord(row, await templateNameForRow(row));
}

export async function updateUniqueBot(
  id: string,
  data: UniqueBotUpdate
): Promise<UniqueBotRecord> {
  const row = await uniqueBotPrisma.uniqueBot.update({
    where: { id },
    data: updateData(data),
  });
  return mapRecord(row, await templateNameForRow(row));
}

export async function getUniqueBotsByGameId(
  gameId: string
): Promise<UniqueBotListItem[]> {
  const rows = await uniqueBotPrisma.uniqueBot.findMany({ where: { gameId } });
  if (rows.length === 0) return [];
  const heldRows = await uniqueBotPrisma.botCharacter.findMany({
    where: {
      botId: { in: rows.map((row) => row.id) },
      sourceType: "UNIQUE",
    },
    select: { botId: true },
  });
  const held = new Set(heldRows.map((row) => row.botId));
  const officialIds = [
    ...new Set(
      rows
        .filter((row) => row.sourceType === "OFFICIAL" && row.botId)
        .map((row) => row.botId as string)
    ),
  ];
  const customIds = [
    ...new Set(
      rows
        .filter((row) => row.sourceType === "CUSTOM" && row.botId)
        .map((row) => row.botId as string)
    ),
  ];
  const [official, custom] = await Promise.all([
    officialIds.length > 0 ? getBotsByIds(officialIds) : Promise.resolve([]),
    customIds.length > 0 ? getCustomBotsByIds(customIds) : Promise.resolve([]),
  ]);
  const names = new Map<string, string>();
  for (const bot of official) names.set(bot.id, bot.name);
  for (const bot of custom) names.set(bot.id, bot.name);
  return rows.map((row) => {
    const templateName = row.botId ? (names.get(row.botId) ?? null) : null;
    const name = firstNonBlank(row.nameOverride, templateName);
    return {
      id: row.id,
      ownerUserId: row.ownerUserId,
      name: name.length > 0 ? name : "Unknown bot",
      held: held.has(row.id),
    };
  });
}
