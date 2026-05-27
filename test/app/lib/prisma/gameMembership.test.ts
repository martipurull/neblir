import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  game: { findUnique: vi.fn() },
  gameCharacter: { deleteMany: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
  characterUser: { findMany: vi.fn() },
  gameUser: { findFirst: vi.fn(), deleteMany: vi.fn() },
  gameInvite: { deleteMany: vi.fn() },
  rollEvent: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
  $transaction: vi.fn(),
};

const updateGameMock = vi.fn();
const userIsGameMasterMock = vi.fn();

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/app/lib/prisma/game", () => ({
  updateGame: updateGameMock,
}));

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  userIsGameMaster: userIsGameMasterMock,
}));

describe("gameMembership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (ops: unknown[]) => {
      for (const op of ops) {
        await op;
      }
    });
  });

  describe("unlinkCharacterFromGame", () => {
    it("removes initiative entries when unlinking a character", async () => {
      prismaMock.game.findUnique.mockResolvedValue({
        initiativeOrder: [
          {
            combatantType: "CHARACTER",
            combatantId: "c-1",
            combatantName: "A",
            rolledValue: 1,
            initiativeModifier: 0,
            submittedAt: new Date(),
          },
          {
            combatantType: "ENEMY",
            combatantId: "e-1",
            combatantName: "B",
            rolledValue: 2,
            initiativeModifier: 0,
            submittedAt: new Date(),
          },
        ],
      });
      prismaMock.gameCharacter.deleteMany.mockResolvedValue({ count: 1 });

      const { unlinkCharacterFromGame } =
        await import("@/app/lib/prisma/gameMembership");
      const result = await unlinkCharacterFromGame("g-1", "c-1");

      expect(result.removed).toBe(true);
      expect(updateGameMock).toHaveBeenCalledWith("g-1", {
        initiativeOrder: [
          expect.objectContaining({
            combatantType: "ENEMY",
            combatantId: "e-1",
          }),
        ],
      });
    });
  });

  describe("removePlayerFromGame", () => {
    it("refuses to remove the game master", async () => {
      prismaMock.game.findUnique.mockResolvedValue({
        gameMaster: "gm-1",
        initiativeOrder: [],
      });

      const { removePlayerFromGame } =
        await import("@/app/lib/prisma/gameMembership");
      const result = await removePlayerFromGame("g-1", "gm-1");

      expect(result).toEqual({ ok: false, reason: "cannot_remove_gm" });
    });

    it("removes membership, characters, invites, and rolls", async () => {
      prismaMock.game.findUnique.mockResolvedValue({
        gameMaster: "gm-1",
        initiativeOrder: [],
      });
      prismaMock.gameUser.findFirst.mockResolvedValue({ id: "gu-1" });
      prismaMock.characterUser.findMany.mockResolvedValue([
        { characterId: "c-1" },
      ]);
      prismaMock.gameCharacter.findMany.mockResolvedValue([
        { characterId: "c-1" },
      ]);

      const { removePlayerFromGame } =
        await import("@/app/lib/prisma/gameMembership");
      const result = await removePlayerFromGame("g-1", "u-2");

      expect(result).toEqual({ ok: true, removedCharacterIds: ["c-1"] });
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.gameCharacter.deleteMany).toHaveBeenCalledWith({
        where: { gameId: "g-1", characterId: { in: ["c-1"] } },
      });
      expect(prismaMock.gameInvite.deleteMany).toHaveBeenCalledWith({
        where: { gameId: "g-1", invitedUserId: "u-2" },
      });
      expect(prismaMock.gameUser.deleteMany).toHaveBeenCalledWith({
        where: { gameId: "g-1", userId: "u-2" },
      });
    });
  });

  describe("gameMasterCanUnlinkCharacter", () => {
    it("returns true when GM and character is linked", async () => {
      userIsGameMasterMock.mockResolvedValue(true);
      prismaMock.gameCharacter.findFirst.mockResolvedValue({ id: "gc-1" });

      const { gameMasterCanUnlinkCharacter } =
        await import("@/app/lib/prisma/gameMembership");
      const allowed = await gameMasterCanUnlinkCharacter("g-1", "c-1", "gm-1");

      expect(allowed).toBe(true);
    });
  });
});
