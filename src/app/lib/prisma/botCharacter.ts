import {
  presentBotHolding,
  type BotHoldingRow,
} from "@/app/lib/botHoldingView";
import type { BotHolding } from "@/app/lib/types/bot";
import { getBotsByIds } from "./bot";
import { prisma } from "./client";

type BotCharacterCreateData = {
  characterId: string;
  botId: string;
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
>;

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
      data: BotCharacterUpdateData;
    }): Promise<BotHoldingRow>;
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

export async function createBotCharacter(data: BotCharacterCreateData) {
  return botCharacterPrisma.botCharacter.create({
    data: {
      characterId: data.characterId,
      botId: data.botId,
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

export async function hydrateBotCharacters(
  records: BotHoldingRow[]
): Promise<BotHolding[]> {
  if (records.length === 0) return [];
  const bots = await getBotsByIds([
    ...new Set(records.map((record) => record.botId)),
  ]);
  const byId = new Map(bots.map((bot) => [bot.id, bot]));
  return records.map((record) =>
    presentBotHolding(record, byId.get(record.botId) ?? null)
  );
}
