import { beforeEach, describe, expect, it, vi } from "vitest";

const enemyInstanceFindMany = vi.fn();
const enemyInstanceDeleteMany = vi.fn();
const gameFindUnique = vi.fn();
const gameUpdate = vi.fn();
const rollEventDeleteMany = vi.fn();

const tx = {
  enemyInstance: {
    findMany: (...args: unknown[]) => enemyInstanceFindMany(...args),
    deleteMany: (...args: unknown[]) => enemyInstanceDeleteMany(...args),
  },
  game: {
    findUnique: (...args: unknown[]) => gameFindUnique(...args),
    update: (...args: unknown[]) => gameUpdate(...args),
  },
  rollEvent: {
    deleteMany: (...args: unknown[]) => rollEventDeleteMany(...args),
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

describe("deleteEnemyInstancesForGame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes ENEMY initiative entries for the deleted set and deletes all instances", async () => {
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

    const { deleteEnemyInstancesForGame } =
      await import("@/app/lib/prisma/enemyInstance");
    const result = await deleteEnemyInstancesForGame("g-1", ["ei-1", "ei-2"]);

    expect(result).toEqual({ deleted: true });
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
      where: { gameId: "g-1", id: { in: ["ei-1", "ei-2"] } },
    });
  });

  it("deletes nothing when any instance id is missing", async () => {
    enemyInstanceFindMany.mockResolvedValue([{ id: "ei-1" }]);

    const { deleteEnemyInstancesForGame } =
      await import("@/app/lib/prisma/enemyInstance");
    const result = await deleteEnemyInstancesForGame("g-1", [
      "ei-1",
      "missing",
    ]);

    expect(result).toEqual({ deleted: false, reason: "not_found" });
    expect(gameUpdate).not.toHaveBeenCalled();
    expect(enemyInstanceDeleteMany).not.toHaveBeenCalled();
  });

  it("skips game initiative update when nothing is removed from the order", async () => {
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

    const { deleteEnemyInstancesForGame } =
      await import("@/app/lib/prisma/enemyInstance");
    const result = await deleteEnemyInstancesForGame("g-1", ["ei-1"]);

    expect(result).toEqual({ deleted: true });
    expect(gameUpdate).not.toHaveBeenCalled();
    expect(enemyInstanceDeleteMany).toHaveBeenCalledWith({
      where: { gameId: "g-1", id: { in: ["ei-1"] } },
    });
  });

  it("does not scrub roll-event metadata", async () => {
    enemyInstanceFindMany.mockResolvedValue([{ id: "ei-1" }]);
    gameFindUnique.mockResolvedValue({ initiativeOrder: [] });

    const { deleteEnemyInstancesForGame } =
      await import("@/app/lib/prisma/enemyInstance");
    await deleteEnemyInstancesForGame("g-1", ["ei-1"]);

    expect(rollEventDeleteMany).not.toHaveBeenCalled();
  });
});
