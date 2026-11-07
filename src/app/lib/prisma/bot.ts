import {
  pickDefinedCombatStats,
  readBotCombatStats,
  type BotCombatStats,
} from "@/app/lib/botCombat";
import { readBotActionList } from "@/app/lib/botActions";
import {
  pickDefinedTrackStats,
  readBotTrackStats,
  type BotTrackStats,
} from "@/app/lib/botTracks";
import type {
  Bot as ParsedBot,
  BotAccessType,
  BotUpdate,
  OfficialBot,
} from "@/app/lib/types/bot";
import { prisma } from "./client";

type BotRow = {
  id: string;
  accessType: BotAccessType;
  name: string;
  imageKey: string | null;
  description: string;
  confCost: number;
  usage: string | null;
  notes: string | null;
  maxHp: number;
  maxCargoWeightKg: number | null;
  maxInstalledItems: number | null;
  speed?: number | null;
  maxCarryWeight?: number | null;
  heightMetres?: number | null;
  weight?: number | null;
  actions?: unknown;
  additionalActions?: unknown;
} & Partial<BotTrackStats> &
  Partial<BotCombatStats>;

type BotCreateData = Omit<BotRow, "id"> & {
  protectedFromOfficialImport?: boolean;
};

function blankToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const botPrisma = prisma as typeof prisma & {
  bot: {
    findMany(args?: { where?: { id?: { in: string[] } } }): Promise<BotRow[]>;
    findUnique(args: { where: { id: string } }): Promise<BotRow | null>;
    create(args: { data: BotCreateData }): Promise<BotRow>;
    update(args: {
      where: { id: string };
      data: Partial<BotCreateData>;
    }): Promise<BotRow>;
  };
};

function mapPrismaBotToApi(row: BotRow): OfficialBot {
  return {
    id: row.id,
    accessType: row.accessType,
    name: row.name,
    imageKey: row.imageKey,
    description: row.description,
    confCost: row.confCost,
    usage: row.usage,
    notes: row.notes,
    maxHp: row.maxHp,
    maxCargoWeightKg: row.maxCargoWeightKg ?? null,
    maxInstalledItems: row.maxInstalledItems ?? null,
    speed: row.speed ?? 0,
    maxCarryWeight: row.maxCarryWeight ?? 0,
    heightMetres: row.heightMetres ?? null,
    weight: row.weight ?? null,
    ...readBotTrackStats(row),
    ...readBotCombatStats(row),
    actions: readBotActionList(row.actions),
    additionalActions: readBotActionList(row.additionalActions),
  };
}

function botCreateDataFromParsed(
  data: ParsedBot,
  options?: { officialCatalogueWrite?: boolean }
): BotCreateData {
  return {
    accessType: data.accessType,
    name: data.name,
    imageKey: blankToNull(data.imageKey),
    description: data.description,
    confCost: data.confCost,
    usage: blankToNull(data.usage),
    notes: blankToNull(data.notes),
    maxHp: data.maxHp,
    maxCargoWeightKg: data.maxCargoWeightKg ?? null,
    maxInstalledItems: data.maxInstalledItems ?? null,
    speed: data.speed ?? 0,
    maxCarryWeight: data.maxCarryWeight ?? 0,
    heightMetres: data.heightMetres ?? null,
    weight: data.weight ?? null,
    ...readBotTrackStats(data),
    ...readBotCombatStats(data),
    actions: data.actions ?? [],
    additionalActions: data.additionalActions ?? [],
    ...(options?.officialCatalogueWrite
      ? { protectedFromOfficialImport: true }
      : {}),
  };
}

function botUpdateDataFromParsed(
  data: BotUpdate,
  options?: { officialCatalogueWrite?: boolean }
): Partial<BotCreateData> {
  return {
    ...(data.accessType !== undefined ? { accessType: data.accessType } : {}),
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.imageKey !== undefined
      ? { imageKey: blankToNull(data.imageKey) }
      : {}),
    ...(data.description !== undefined
      ? { description: data.description }
      : {}),
    ...(data.confCost !== undefined ? { confCost: data.confCost } : {}),
    ...(data.usage !== undefined ? { usage: blankToNull(data.usage) } : {}),
    ...(data.notes !== undefined ? { notes: blankToNull(data.notes) } : {}),
    ...(data.maxHp !== undefined ? { maxHp: data.maxHp } : {}),
    ...(data.maxCargoWeightKg !== undefined
      ? { maxCargoWeightKg: data.maxCargoWeightKg ?? null }
      : {}),
    ...(data.maxInstalledItems !== undefined
      ? { maxInstalledItems: data.maxInstalledItems ?? null }
      : {}),
    ...(data.speed !== undefined ? { speed: data.speed ?? 0 } : {}),
    ...(data.maxCarryWeight !== undefined
      ? { maxCarryWeight: data.maxCarryWeight ?? 0 }
      : {}),
    ...(data.heightMetres !== undefined
      ? { heightMetres: data.heightMetres ?? null }
      : {}),
    ...(data.weight !== undefined ? { weight: data.weight ?? null } : {}),
    ...pickDefinedTrackStats(data),
    ...pickDefinedCombatStats(data),
    ...(data.actions !== undefined ? { actions: data.actions } : {}),
    ...(data.additionalActions !== undefined
      ? { additionalActions: data.additionalActions }
      : {}),
    ...(options?.officialCatalogueWrite
      ? { protectedFromOfficialImport: true }
      : {}),
  };
}

export async function getBots(): Promise<OfficialBot[]> {
  const rows = await botPrisma.bot.findMany();
  return rows.map(mapPrismaBotToApi);
}

export async function getBotsByIds(ids: string[]): Promise<OfficialBot[]> {
  if (ids.length === 0) return [];
  const rows = await botPrisma.bot.findMany({
    where: { id: { in: ids } },
  });
  return rows.map(mapPrismaBotToApi);
}

export async function getBot(id: string): Promise<OfficialBot | null> {
  const row = await botPrisma.bot.findUnique({ where: { id } });
  return row ? mapPrismaBotToApi(row) : null;
}

export async function createBot(
  data: ParsedBot,
  options?: { officialCatalogueWrite?: boolean }
): Promise<OfficialBot> {
  const row = await botPrisma.bot.create({
    data: botCreateDataFromParsed(data, options),
  });
  return mapPrismaBotToApi(row);
}

export async function updateBot(
  id: string,
  data: BotUpdate,
  options?: { officialCatalogueWrite?: boolean }
): Promise<OfficialBot> {
  const row = await botPrisma.bot.update({
    where: { id },
    data: botUpdateDataFromParsed(data, options),
  });
  return mapPrismaBotToApi(row);
}
