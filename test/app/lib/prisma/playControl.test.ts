import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  characterUser: { findFirst: vi.fn() },
  gameCharacter: { findFirst: vi.fn() },
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
});
