import {
  botHoldingSource,
  presentBotHolding,
  type BotHoldingRow,
  type BotTemplateView,
} from "@/app/lib/botHoldingView";
import {
  readBotTrackStats,
  type BotHoldingTrackState,
  type BotTrackStats,
} from "@/app/lib/botTracks";
import type { BotHolding } from "@/app/lib/types/bot";
import { getBot, getBotsByIds } from "./bot";
import { getCustomBot, getCustomBotsByIds } from "./customBot";
import {
  getResolvedUniqueBotsByIds,
  resolveUniqueBotTemplate,
} from "./uniqueBot";
import { placementsForHoldings } from "./botPlacement";
import { prisma } from "./client";

export class BotCharacterConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BotCharacterConflictError";
  }
}

export const UNIQUE_BOT_ALREADY_HELD_MESSAGE =
  "This unique bot already has a holding.";

type BotCharacterCreateData = {
  characterId: string;
  botId: string;
  sourceType?: "OFFICIAL" | "CUSTOM" | "UNIQUE";
  currentHp: number;
  maxHpBonus?: number;
  customName?: string | null;
  notes?: string | null;
};

type BotCharacterUpdateData = Partial<
  Pick<
    BotCharacterCreateData,
    "currentHp" | "maxHpBonus" | "customName" | "notes"
  >
> &
  Partial<BotHoldingTrackState>;

const botCharacterPrisma = prisma as typeof prisma & {
  botCharacter: {
    findMany(args: {
      where: { characterId: string } | { botId: string };
    }): Promise<BotHoldingRow[]>;
    findFirst(args: {
      where: { id: string; characterId: string };
    }): Promise<BotHoldingRow | null>;
    create(args: { data: BotCharacterCreateData }): Promise<BotHoldingRow>;
    update(args: {
      where: { id: string };
      data: BotCharacterUpdateData & { characterId?: string };
    }): Promise<BotHoldingRow>;
    delete(args: { where: { id: string } }): Promise<BotHoldingRow>;
    deleteMany(args: {
      where: { characterId: string };
    }): Promise<{ count: number }>;
  };
};

export async function listBotCharacterRows(
  characterId: string
): Promise<BotHoldingRow[]> {
  return botCharacterPrisma.botCharacter.findMany({
    where: { characterId },
  });
}

export async function listBotCharacterRowsByBot(
  botId: string
): Promise<BotHoldingRow[]> {
  return botCharacterPrisma.botCharacter.findMany({
    where: { botId },
  });
}

export async function getBotCharacterRow(
  characterId: string,
  botCharacterId: string
): Promise<BotHoldingRow | null> {
  return botCharacterPrisma.botCharacter.findFirst({
    where: { id: botCharacterId, characterId },
  });
}

export async function uniqueBotHoldingExists(botId: string): Promise<boolean> {
  const existing = await listBotCharacterRowsByBot(botId);
  return existing.some((row) => row.sourceType === "UNIQUE");
}

export async function createBotCharacter(data: BotCharacterCreateData) {
  if (
    data.sourceType === "UNIQUE" &&
    (await uniqueBotHoldingExists(data.botId))
  ) {
    throw new BotCharacterConflictError(UNIQUE_BOT_ALREADY_HELD_MESSAGE);
  }

  return botCharacterPrisma.botCharacter.create({
    data: {
      characterId: data.characterId,
      botId: data.botId,
      ...(data.sourceType ? { sourceType: data.sourceType } : {}),
      currentHp: data.currentHp,
      maxHpBonus: data.maxHpBonus ?? 0,
      customName: data.customName ?? null,
      notes: data.notes ?? null,
    },
  });
}

export async function updateBotCharacter(
  id: string,
  data: BotCharacterUpdateData
) {
  return botCharacterPrisma.botCharacter.update({
    where: { id },
    data,
  });
}

function templateView(
  bot: {
    id?: string;
    name?: string;
    imageKey?: string | null;
    description?: string | null;
    confCost?: number | null;
    usage?: string | null;
    notes?: string | null;
    maxHp?: number;
    accessType?: BotTemplateView["accessType"];
    maxCargoWeightKg?: number | null;
    maxInstalledItems?: number | null;
    speed?: number | null;
    maxCarryWeight?: number | null;
    heightMetres?: number | null;
    weight?: number | null;
  } & Partial<BotTrackStats>
): BotTemplateView {
  return {
    id: bot.id ?? "",
    name: bot.name ?? "",
    imageKey: bot.imageKey ?? null,
    description: bot.description ?? null,
    confCost: bot.confCost ?? null,
    usage: bot.usage ?? null,
    notes: bot.notes ?? null,
    maxHp: bot.maxHp ?? 0,
    accessType: bot.accessType ?? null,
    maxCargoWeightKg: bot.maxCargoWeightKg ?? null,
    maxInstalledItems: bot.maxInstalledItems ?? null,
    speed: bot.speed ?? 0,
    maxCarryWeight: bot.maxCarryWeight ?? 0,
    heightMetres: bot.heightMetres ?? null,
    weight: bot.weight ?? null,
    ...readBotTrackStats(bot),
  };
}

export async function hydrateBotCharacters(
  records: BotHoldingRow[]
): Promise<BotHolding[]> {
  if (records.length === 0) return [];
  const officialIds = [
    ...new Set(
      records
        .filter((record) => botHoldingSource(record) === "OFFICIAL")
        .map((record) => record.botId)
    ),
  ];
  const customIds = [
    ...new Set(
      records
        .filter((record) => botHoldingSource(record) === "CUSTOM")
        .map((record) => record.botId)
    ),
  ];
  const uniqueIds = [
    ...new Set(
      records
        .filter((record) => botHoldingSource(record) === "UNIQUE")
        .map((record) => record.botId)
    ),
  ];
  const [official, custom, unique] = await Promise.all([
    officialIds.length > 0 ? getBotsByIds(officialIds) : Promise.resolve([]),
    customIds.length > 0 ? getCustomBotsByIds(customIds) : Promise.resolve([]),
    uniqueIds.length > 0
      ? getResolvedUniqueBotsByIds(uniqueIds)
      : Promise.resolve([]),
  ]);
  const officialById = new Map(official.map((bot) => [bot.id, bot]));
  const customById = new Map(custom.map((bot) => [bot.id, templateView(bot)]));
  const uniqueById = new Map(unique.map((bot) => [bot.id, bot]));
  const placements = await placementsForHoldings(records);
  return records.map((record) => {
    const source = botHoldingSource(record);
    const template =
      source === "CUSTOM"
        ? (customById.get(record.botId) ?? null)
        : source === "UNIQUE"
          ? (uniqueById.get(record.botId) ?? null)
          : (officialById.get(record.botId) ?? null);
    return presentBotHolding(record, template, placements.get(record.id));
  });
}

export async function resolveHoldingTemplate(
  row: BotHoldingRow
): Promise<BotTemplateView | null> {
  const source = botHoldingSource(row);
  if (source === "CUSTOM") {
    const bot = await getCustomBot(row.botId);
    return bot ? templateView(bot) : null;
  }
  if (source === "UNIQUE") {
    return resolveUniqueBotTemplate(row.botId);
  }
  const bot = await getBot(row.botId);
  return bot ? templateView(bot) : null;
}

export async function moveBotCharacter(id: string, characterId: string) {
  return botCharacterPrisma.botCharacter.update({
    where: { id },
    data: { characterId },
  });
}

export async function deleteBotCharacter(id: string) {
  return botCharacterPrisma.botCharacter.delete({ where: { id } });
}
