import { beforeEach, describe, expect, it, vi } from "vitest";

const enemyDelete = vi.fn();
const enemyInstanceFindMany = vi.fn();
const enemyInstanceDeleteMany = vi.fn();
const gameFindUnique = vi.fn();
const gameUpdate = vi.fn();

const tx = {
  enemy: {
    delete: (...args: unknown[]) => enemyDelete(...args),
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

describe("deleteOfficialEnemy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("strips initiative for spawned Enemy instances, then deletes the instances and Official enemy", async () => {
    enemyInstanceFindMany.mockResolvedValue([
      { id: "ei-1", gameId: "g-1" },
      { id: "ei-2", gameId: "g-1" },
    ]);
    gameFindUnique.mockResolvedValue({
      initiativeOrder: [
        {
          combatantType: "ENEMY",
          combatantId: "ei-1",
          combatantName: "Bandit A",
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
    enemyDelete.mockResolvedValue({ id: "e-1" });

    const { deleteOfficialEnemy } = await import("@/app/lib/prisma/enemy");
    await deleteOfficialEnemy("e-1");

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
      where: { sourceOfficialEnemyId: "e-1" },
    });
    expect(enemyDelete).toHaveBeenCalledWith({ where: { id: "e-1" } });
  });

  it("skips game initiative update when nothing is removed", async () => {
    enemyInstanceFindMany.mockResolvedValue([{ id: "ei-1", gameId: "g-1" }]);
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
    enemyDelete.mockResolvedValue({ id: "e-1" });

    const { deleteOfficialEnemy } = await import("@/app/lib/prisma/enemy");
    await deleteOfficialEnemy("e-1");

    expect(gameUpdate).not.toHaveBeenCalled();
    expect(enemyInstanceDeleteMany).toHaveBeenCalledWith({
      where: { sourceOfficialEnemyId: "e-1" },
    });
    expect(enemyDelete).toHaveBeenCalledWith({ where: { id: "e-1" } });
  });
});
