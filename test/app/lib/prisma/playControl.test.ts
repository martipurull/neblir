import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  characterUser: { findFirst: vi.fn() },
  gameCharacter: { findFirst: vi.fn() },
  game: { findUnique: vi.fn() },
};

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: prismaMock,
}));

describe("userHasPlayControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is true for an Owner", async () => {
    prismaMock.characterUser.findFirst.mockResolvedValue({
      characterId: "c-1",
      userId: "owner-1",
    });

    const { userHasPlayControl } =
      await import("@/app/lib/prisma/gameCharacter");
    await expect(userHasPlayControl("c-1", "owner-1")).resolves.toBe(true);
  });

  it("is true for the GM of a game the character is linked to", async () => {
    prismaMock.characterUser.findFirst.mockResolvedValue(null);
    prismaMock.gameCharacter.findFirst.mockResolvedValue({ id: "gc-1" });

    const { userHasPlayControl } =
      await import("@/app/lib/prisma/gameCharacter");
    await expect(userHasPlayControl("c-1", "gm-1")).resolves.toBe(true);
  });

  it("is false for a third player who is not an Owner and not the GM", async () => {
    prismaMock.characterUser.findFirst.mockResolvedValue(null);
    prismaMock.gameCharacter.findFirst.mockResolvedValue(null);

    const { userHasPlayControl } =
      await import("@/app/lib/prisma/gameCharacter");
    await expect(userHasPlayControl("c-1", "other-1")).resolves.toBe(false);
  });

  it("is true for a play-grant holder on a linked game", async () => {
    prismaMock.characterUser.findFirst.mockResolvedValue(null);
    prismaMock.gameCharacter.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "gc-grant" });

    const { userHasPlayControl } =
      await import("@/app/lib/prisma/gameCharacter");
    await expect(userHasPlayControl("c-1", "grantee-1")).resolves.toBe(true);
    expect(prismaMock.gameCharacter.findFirst).toHaveBeenNthCalledWith(2, {
      where: { characterId: "c-1", playGrantUserId: "grantee-1" },
      select: { id: true },
    });
  });
});

describe("userCanViewGameScopedCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is true for the game master of a linked character", async () => {
    prismaMock.game.findUnique.mockResolvedValue({ gameMaster: "gm-1" });
    prismaMock.gameCharacter.findFirst.mockResolvedValue({ id: "gc-1" });

    const { userCanViewGameScopedCharacter } =
      await import("@/app/lib/prisma/gameCharacter");
    await expect(
      userCanViewGameScopedCharacter("g-1", "c-1", "gm-1")
    ).resolves.toBe(true);
  });

  it("is true for the play-grant holder on that game link", async () => {
    prismaMock.game.findUnique.mockResolvedValue({ gameMaster: "gm-1" });
    prismaMock.gameCharacter.findFirst.mockResolvedValue({ id: "gc-grant" });

    const { userCanViewGameScopedCharacter } =
      await import("@/app/lib/prisma/gameCharacter");
    await expect(
      userCanViewGameScopedCharacter("g-1", "c-1", "grantee-1")
    ).resolves.toBe(true);
  });

  it("is false for a third player", async () => {
    prismaMock.game.findUnique.mockResolvedValue({ gameMaster: "gm-1" });
    prismaMock.gameCharacter.findFirst.mockResolvedValue(null);

    const { userCanViewGameScopedCharacter } =
      await import("@/app/lib/prisma/gameCharacter");
    await expect(
      userCanViewGameScopedCharacter("g-1", "c-1", "other-1")
    ).resolves.toBe(false);
  });
});

describe("userHasPlayControlInGame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is false when the character is not linked to that game", async () => {
    prismaMock.gameCharacter.findFirst.mockResolvedValue(null);

    const { userHasPlayControlInGame } =
      await import("@/app/lib/prisma/gameCharacter");
    await expect(
      userHasPlayControlInGame("g-b", "c-1", "grantee-1")
    ).resolves.toBe(false);
  });

  it("is true for a play-grant holder in that game", async () => {
    prismaMock.gameCharacter.findFirst
      .mockResolvedValueOnce({ id: "gc-1" })
      .mockResolvedValueOnce({ id: "gc-grant" });
    prismaMock.game.findUnique.mockResolvedValue({ gameMaster: "gm-1" });
    prismaMock.characterUser.findFirst.mockResolvedValue(null);

    const { userHasPlayControlInGame } =
      await import("@/app/lib/prisma/gameCharacter");
    await expect(
      userHasPlayControlInGame("g-a", "c-1", "grantee-1")
    ).resolves.toBe(true);
  });
});
