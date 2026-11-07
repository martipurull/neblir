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
  CustomBotCreate,
  CustomBotResponse,
  CustomBotUpdate,
} from "@/app/lib/types/bot";
import { prisma } from "./client";

type CustomBotRow = {
  id: string;
  gameId: string;
  name: string;
  description: string | null;
  confCost: number | null;
  usage: string | null;
  notes: string | null;
  maxHp: number;
  membersCanModify: boolean;
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

type CustomBotWriteData = Omit<CustomBotRow, "id">;

function blankToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapRow(row: CustomBotRow): CustomBotResponse {
  return {
    id: row.id,
    gameId: row.gameId,
    name: row.name,
    description: row.description,
    confCost: row.confCost,
    usage: row.usage,
    notes: row.notes,
    maxHp: row.maxHp,
    membersCanModify: row.membersCanModify,
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

function writeData(data: CustomBotCreate): CustomBotWriteData {
  return {
    gameId: data.gameId,
    name: data.name,
    description: blankToNull(data.description),
    confCost: data.confCost ?? null,
    usage: blankToNull(data.usage),
    notes: blankToNull(data.notes),
    maxHp: data.maxHp,
    membersCanModify: data.membersCanModify,
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
  };
}

const customBotPrisma = prisma as typeof prisma & {
  customBot: {
    findMany(args: {
      where: { gameId: string } | { id: { in: string[] } };
    }): Promise<CustomBotRow[]>;
    findUnique(args: { where: { id: string } }): Promise<CustomBotRow | null>;
    create(args: { data: CustomBotWriteData }): Promise<CustomBotRow>;
    update(args: {
      where: { id: string };
      data: Partial<CustomBotWriteData>;
    }): Promise<CustomBotRow>;
  };
};

export async function getCustomBotsByGame(
  gameId: string
): Promise<CustomBotResponse[]> {
  const rows = await customBotPrisma.customBot.findMany({ where: { gameId } });
  return rows.map(mapRow);
}

export async function getCustomBotsByIds(
  ids: string[]
): Promise<CustomBotResponse[]> {
  if (ids.length === 0) return [];
  const rows = await customBotPrisma.customBot.findMany({
    where: { id: { in: ids } },
  });
  return rows.map(mapRow);
}

export async function getCustomBot(
  id: string
): Promise<CustomBotResponse | null> {
  const row = await customBotPrisma.customBot.findUnique({ where: { id } });
  return row ? mapRow(row) : null;
}

export async function createCustomBot(
  data: CustomBotCreate
): Promise<CustomBotResponse> {
  const row = await customBotPrisma.customBot.create({ data: writeData(data) });
  return mapRow(row);
}

export async function updateCustomBot(
  id: string,
  data: CustomBotUpdate
): Promise<CustomBotResponse> {
  const row = await customBotPrisma.customBot.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined
        ? { description: blankToNull(data.description) }
        : {}),
      ...(data.confCost !== undefined
        ? { confCost: data.confCost ?? null }
        : {}),
      ...(data.usage !== undefined ? { usage: blankToNull(data.usage) } : {}),
      ...(data.notes !== undefined ? { notes: blankToNull(data.notes) } : {}),
      ...(data.maxHp !== undefined ? { maxHp: data.maxHp } : {}),
      ...(data.membersCanModify !== undefined
        ? { membersCanModify: data.membersCanModify }
        : {}),
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
    },
  });
  return mapRow(row);
}
