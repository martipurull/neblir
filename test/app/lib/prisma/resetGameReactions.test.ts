import { beforeEach, describe, expect, it, vi } from "vitest";

const characterFindMany = vi.fn();
const characterUpdate = vi.fn();
const enemyInstanceFindMany = vi.fn();
const enemyInstanceUpdate = vi.fn();
const botCharacterFindMany = vi.fn();
const botCharacterUpdate = vi.fn();
const botFindUnique = vi.fn();
const customBotFindUnique = vi.fn();
const uniqueBotFindUnique = vi.fn();

const tx = {
  character: {
    findMany: (...args: unknown[]) => characterFindMany(...args),
    update: (...args: unknown[]) => characterUpdate(...args),
  },
  enemyInstance: {
    findMany: (...args: unknown[]) => enemyInstanceFindMany(...args),
    update: (...args: unknown[]) => enemyInstanceUpdate(...args),
  },
  botCharacter: {
    findMany: (...args: unknown[]) => botCharacterFindMany(...args),
    update: (...args: unknown[]) => botCharacterUpdate(...args),
  },
  bot: {
    findUnique: (...args: unknown[]) => botFindUnique(...args),
  },
  customBot: {
    findUnique: (...args: unknown[]) => customBotFindUnique(...args),
  },
  uniqueBot: {
    findUnique: (...args: unknown[]) => uniqueBotFindUnique(...args),
  },
};

const prismaTransaction = vi.fn(
  async (callback: (value: typeof tx) => unknown) => callback(tx)
);

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    $transaction: prismaTransaction,
  },
}));

function combatInfo(remaining: number, perRound: number) {
  return {
    armourCurrentHP: 0,
    armourMaxHP: 0,
    armourMod: 0,
    initiativeMod: 0,
    meleeAttackMod: 0,
    meleeDefenceMod: 0,
    rangeAttackMod: 0,
    rangeDefenceMod: 0,
    throwAttackMod: 0,
    speed: 0,
    reactionsPerRound: perRound,
    reactionsRemaining: remaining,
    maxCarryWeight: 0,
  };
}

describe("resetReactionsForGame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    characterUpdate.mockResolvedValue({});
    enemyInstanceUpdate.mockResolvedValue({});
    botCharacterFindMany.mockResolvedValue([]);
    botCharacterUpdate.mockResolvedValue({});
    botFindUnique.mockResolvedValue(null);
    customBotFindUnique.mockResolvedValue(null);
    uniqueBotFindUnique.mockResolvedValue(null);
  });

  it("restores remaining reactions for every character and enemy instance in the game", async () => {
    characterFindMany.mockResolvedValue([
      { id: "c-spent", combatInformation: combatInfo(0, 2) },
      { id: "c-full", combatInformation: combatInfo(1, 1) },
    ]);
    enemyInstanceFindMany.mockResolvedValue([
      {
        id: "ei-spent",
        reactionsPerRound: 3,
        reactionsRemaining: 1,
        status: "DEAD",
      },
      {
        id: "ei-full",
        reactionsPerRound: 2,
        reactionsRemaining: 2,
        status: "ACTIVE",
      },
    ]);

    const { resetReactionsForGame } =
      await import("@/app/lib/prisma/resetGameReactions");
    await resetReactionsForGame("g-1");

    expect(characterFindMany).toHaveBeenCalledWith({
      where: { games: { some: { gameId: "g-1" } } },
      select: { id: true, combatInformation: true },
    });
    expect(enemyInstanceFindMany).toHaveBeenCalledWith({
      where: { gameId: "g-1" },
      select: {
        id: true,
        reactionsPerRound: true,
        reactionsRemaining: true,
      },
    });

    expect(characterUpdate).toHaveBeenCalledTimes(1);
    expect(characterUpdate).toHaveBeenCalledWith({
      where: { id: "c-spent" },
      data: {
        combatInformation: combatInfo(2, 2),
      },
    });
    expect(enemyInstanceUpdate).toHaveBeenCalledTimes(1);
    expect(enemyInstanceUpdate).toHaveBeenCalledWith({
      where: { id: "ei-spent" },
      data: { reactionsRemaining: 3 },
    });
    expect(botCharacterFindMany).toHaveBeenCalledWith({
      where: { character: { games: { some: { gameId: "g-1" } } } },
      select: {
        id: true,
        botId: true,
        sourceType: true,
        reactionsRemaining: true,
      },
    });
  });

  it("restores a bot holding to its Reaction cap", async () => {
    characterFindMany.mockResolvedValue([]);
    enemyInstanceFindMany.mockResolvedValue([]);
    botCharacterFindMany.mockResolvedValue([
      {
        id: "hold-spent",
        botId: "bot-1",
        sourceType: "OFFICIAL",
        reactionsRemaining: 0,
      },
      {
        id: "hold-full",
        botId: "bot-2",
        sourceType: "OFFICIAL",
        reactionsRemaining: 4,
      },
    ]);
    botFindUnique.mockImplementation(
      async (args: { where: { id: string } }) => {
        if (args.where.id === "bot-1") return { numberOfReactions: 2 };
        if (args.where.id === "bot-2") return { numberOfReactions: 4 };
        return null;
      }
    );

    const { resetReactionsForGame } =
      await import("@/app/lib/prisma/resetGameReactions");
    await resetReactionsForGame("g-1");

    expect(botCharacterUpdate).toHaveBeenCalledTimes(1);
    expect(botCharacterUpdate).toHaveBeenCalledWith({
      where: { id: "hold-spent" },
      data: { reactionsRemaining: 2 },
    });
  });
});
