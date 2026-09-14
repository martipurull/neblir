import { beforeEach, describe, expect, it, vi } from "vitest";

const characterFindMany = vi.fn();
const characterUpdate = vi.fn();
const enemyInstanceFindMany = vi.fn();
const enemyInstanceUpdate = vi.fn();

const tx = {
  character: {
    findMany: (...args: unknown[]) => characterFindMany(...args),
    update: (...args: unknown[]) => characterUpdate(...args),
  },
  enemyInstance: {
    findMany: (...args: unknown[]) => enemyInstanceFindMany(...args),
    update: (...args: unknown[]) => enemyInstanceUpdate(...args),
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
  });
});
