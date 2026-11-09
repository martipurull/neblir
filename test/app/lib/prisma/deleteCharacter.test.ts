import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  pathCharacter: { deleteMany: vi.fn() },
  featureCharacter: { deleteMany: vi.fn() },
  gameCharacter: { deleteMany: vi.fn() },
  characterUser: { deleteMany: vi.fn() },
  itemCharacter: { deleteMany: vi.fn() },
  characterCurrency: { deleteMany: vi.fn() },
  botCharacter: { deleteMany: vi.fn() },
  character: { delete: vi.fn() },
};

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    $transaction: async (fn: (transaction: typeof tx) => Promise<unknown>) =>
      fn(tx),
  },
}));

describe("deleteCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const table of [
      tx.pathCharacter,
      tx.featureCharacter,
      tx.gameCharacter,
      tx.characterUser,
      tx.itemCharacter,
      tx.characterCurrency,
      tx.botCharacter,
    ]) {
      table.deleteMany.mockResolvedValue({ count: 1 });
    }
    tx.character.delete.mockResolvedValue({ id: "char-1" });
  });

  it("deletes the character's bot holdings", async () => {
    const { deleteCharacter } = await import("@/app/lib/prisma/character");

    await deleteCharacter("char-1");

    expect(tx.botCharacter.deleteMany).toHaveBeenCalledWith({
      where: { characterId: "char-1" },
    });
    expect(tx.character.delete).toHaveBeenCalledWith({
      where: { id: "char-1" },
    });
  });
});
