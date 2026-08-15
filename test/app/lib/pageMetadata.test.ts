import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.fn();
const userIsInGameMock = vi.fn();
const characterBelongsToUserMock = vi.fn();
const gameMasterCanViewGameCharacterMock = vi.fn();

const prismaMock = {
  game: { findUnique: vi.fn() },
  character: { findUnique: vi.fn() },
  enemyInstance: { findFirst: vi.fn() },
};

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/app/lib/prisma/game", () => ({
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  gameMasterCanViewGameCharacter: gameMasterCanViewGameCharacterMock,
}));

describe("pageMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user-1" } });
  });

  describe("resolveGamePageTitle", () => {
    it("returns the game name for a member", async () => {
      userIsInGameMock.mockResolvedValue(true);
      prismaMock.game.findUnique.mockResolvedValue({ name: "Midnight Run" });

      const { resolveGamePageTitle } = await import("@/app/lib/pageMetadata");
      await expect(resolveGamePageTitle("g-1")).resolves.toBe("Midnight Run");
    });

    it("hides the name when the viewer is not in the game", async () => {
      userIsInGameMock.mockResolvedValue(false);

      const { resolveGamePageTitle } = await import("@/app/lib/pageMetadata");
      await expect(resolveGamePageTitle("g-1")).resolves.toBe("Game");
      expect(prismaMock.game.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("resolveOwnedCharacterPageTitle", () => {
    it("returns the display name for the owner", async () => {
      characterBelongsToUserMock.mockResolvedValue(true);
      prismaMock.character.findUnique.mockResolvedValue({
        generalInformation: { name: "Aria", surname: "Vale" },
      });

      const { resolveOwnedCharacterPageTitle } =
        await import("@/app/lib/pageMetadata");
      await expect(resolveOwnedCharacterPageTitle("c-1")).resolves.toBe(
        "Aria Vale"
      );
    });

    it("hides the name when the character is not owned", async () => {
      characterBelongsToUserMock.mockResolvedValue(false);

      const { resolveOwnedCharacterPageTitle } =
        await import("@/app/lib/pageMetadata");
      await expect(resolveOwnedCharacterPageTitle("c-1")).resolves.toBe(
        "Character"
      );
      expect(prismaMock.character.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("resolveGameCharacterPageTitle", () => {
    it("returns the display name for the game master", async () => {
      gameMasterCanViewGameCharacterMock.mockResolvedValue(true);
      prismaMock.character.findUnique.mockResolvedValue({
        generalInformation: { name: "Bren", surname: "" },
      });

      const { resolveGameCharacterPageTitle } =
        await import("@/app/lib/pageMetadata");
      await expect(resolveGameCharacterPageTitle("g-1", "c-1")).resolves.toBe(
        "Bren"
      );
    });

    it("hides the name when the viewer is not the game master", async () => {
      gameMasterCanViewGameCharacterMock.mockResolvedValue(false);

      const { resolveGameCharacterPageTitle } =
        await import("@/app/lib/pageMetadata");
      await expect(resolveGameCharacterPageTitle("g-1", "c-1")).resolves.toBe(
        "Character"
      );
    });
  });

  describe("resolveEnemyInstancePageTitle", () => {
    it("returns the name for a public enemy to a player", async () => {
      prismaMock.game.findUnique.mockResolvedValue({ gameMaster: "gm-1" });
      userIsInGameMock.mockResolvedValue(true);
      prismaMock.enemyInstance.findFirst.mockResolvedValue({
        name: "Ash Warden",
        isPublic: true,
      });

      const { resolveEnemyInstancePageTitle } =
        await import("@/app/lib/pageMetadata");
      await expect(resolveEnemyInstancePageTitle("g-1", "e-1")).resolves.toBe(
        "Ash Warden"
      );
    });

    it("hides a private enemy name from a non-GM", async () => {
      prismaMock.game.findUnique.mockResolvedValue({ gameMaster: "gm-1" });
      userIsInGameMock.mockResolvedValue(true);
      prismaMock.enemyInstance.findFirst.mockResolvedValue({
        name: "Hidden Horror",
        isPublic: false,
      });

      const { resolveEnemyInstancePageTitle } =
        await import("@/app/lib/pageMetadata");
      await expect(resolveEnemyInstancePageTitle("g-1", "e-1")).resolves.toBe(
        "Enemy"
      );
    });

    it("returns a private enemy name to the game master", async () => {
      authMock.mockResolvedValue({ user: { id: "gm-1" } });
      prismaMock.game.findUnique.mockResolvedValue({ gameMaster: "gm-1" });
      prismaMock.enemyInstance.findFirst.mockResolvedValue({
        name: "Hidden Horror",
        isPublic: false,
      });

      const { resolveEnemyInstancePageTitle } =
        await import("@/app/lib/pageMetadata");
      await expect(resolveEnemyInstancePageTitle("g-1", "e-1")).resolves.toBe(
        "Hidden Horror"
      );
    });
  });
});
