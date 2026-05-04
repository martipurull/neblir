import { beforeEach, describe, expect, it, vi } from "vitest";

const customEnemyFindUnique = vi.fn();
const customEnemyDelete = vi.fn();
const enemyInstanceFindMany = vi.fn();
const enemyInstanceDeleteMany = vi.fn();
const gameFindUnique = vi.fn();
const gameUpdate = vi.fn();

const tx = {
  customEnemy: {
    findUnique: (...args: unknown[]) => customEnemyFindUnique(...args),
    delete: (...args: unknown[]) => customEnemyDelete(...args),
  },
  enemyInstance: {
    findMany: (...args: unknown[]) => enemyInstanceFindMany(...args),
    deleteMany: (...args: unknown[]) => enemyInstanceDeleteMany(...args),
  },
  game: {
    findUnique: (...args: unknown[]) => gameFindUnique(...args),
    update: (...args: unknown[]) => gameUpdate(...args),
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

describe("deleteCustomEnemy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes initiative entries for spawned instances being deleted", async () => {
    customEnemyFindUnique.mockResolvedValue({ gameId: "g-1" });
    enemyInstanceFindMany.mockResolvedValue([{ id: "ei-1" }, { id: "ei-2" }]);
    gameFindUnique.mockResolvedValue({
      initiativeOrder: [
        {
          combatantType: "ENEMY",
          combatantId: "ei-1",
          combatantName: "Goblin A",
          rolledValue: 14,
          initiativeModifier: 2,
          submittedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
        {
          combatantType: "ENEMY",
          combatantId: "ei-other",
          combatantName: "Orc",
          rolledValue: 12,
          initiativeModifier: 1,
          submittedAt: new Date("2026-01-01T00:01:00.000Z"),
        },
        {
          combatantType: "CHARACTER",
          combatantId: "char-1",
          combatantName: "Ada",
          rolledValue: 16,
          initiativeModifier: 3,
          submittedAt: new Date("2026-01-01T00:02:00.000Z"),
        },
      ],
    });
    customEnemyDelete.mockResolvedValue({ id: "ce-1" });

    const { deleteCustomEnemy } = await import("@/app/lib/prisma/customEnemy");
    await deleteCustomEnemy("ce-1");

    expect(gameUpdate).toHaveBeenCalledWith({
      where: { id: "g-1" },
      data: {
        initiativeOrder: [
          {
            combatantType: "ENEMY",
            combatantId: "ei-other",
            combatantName: "Orc",
            rolledValue: 12,
            initiativeModifier: 1,
            submittedAt: new Date("2026-01-01T00:01:00.000Z"),
          },
          {
            combatantType: "CHARACTER",
            combatantId: "char-1",
            combatantName: "Ada",
            rolledValue: 16,
            initiativeModifier: 3,
            submittedAt: new Date("2026-01-01T00:02:00.000Z"),
          },
        ],
      },
    });
    expect(enemyInstanceDeleteMany).toHaveBeenCalledWith({
      where: { sourceCustomEnemyId: "ce-1" },
    });
    expect(customEnemyDelete).toHaveBeenCalledWith({ where: { id: "ce-1" } });
  });

  it("skips game initiative update when nothing is removed", async () => {
    customEnemyFindUnique.mockResolvedValue({ gameId: "g-1" });
    enemyInstanceFindMany.mockResolvedValue([{ id: "ei-1" }]);
    gameFindUnique.mockResolvedValue({
      initiativeOrder: [
        {
          combatantType: "ENEMY",
          combatantId: "ei-other",
          combatantName: "Orc",
          rolledValue: 12,
          initiativeModifier: 1,
          submittedAt: new Date("2026-01-01T00:01:00.000Z"),
        },
      ],
    });
    customEnemyDelete.mockResolvedValue({ id: "ce-1" });

    const { deleteCustomEnemy } = await import("@/app/lib/prisma/customEnemy");
    await deleteCustomEnemy("ce-1");

    expect(gameUpdate).not.toHaveBeenCalled();
    expect(enemyInstanceDeleteMany).toHaveBeenCalledWith({
      where: { sourceCustomEnemyId: "ce-1" },
    });
    expect(customEnemyDelete).toHaveBeenCalledWith({ where: { id: "ce-1" } });
  });
});
