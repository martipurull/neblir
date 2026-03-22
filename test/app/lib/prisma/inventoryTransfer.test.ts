import {
  equipSlotsAfterTransferOut,
  splitStackUses,
  validateInventoryTransferParties,
} from "@/app/lib/prisma/inventoryTransfer";
import { prisma } from "@/app/lib/prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    character: { findUnique: vi.fn() },
    customItem: { findUnique: vi.fn() },
    uniqueItem: { findUnique: vi.fn() },
    gameCharacter: { findMany: vi.fn(), findFirst: vi.fn() },
  },
}));

describe("splitStackUses", () => {
  it("splits uses proportionally (floor)", () => {
    expect(splitStackUses(10, 3, 2)).toEqual({ transferred: 6, remaining: 4 });
  });

  it("returns all uses as remaining when transfer quantity is zero edge", () => {
    expect(splitStackUses(5, 3, 0)).toEqual({ transferred: 0, remaining: 5 });
  });
});

describe("equipSlotsAfterTransferOut", () => {
  it("trims equipped slots to new stack size", () => {
    expect(equipSlotsAfterTransferOut(["HAND", "HAND", "FOOT"], 1)).toEqual([
      "HAND",
    ]);
  });
});

describe("validateInventoryTransferParties", () => {
  beforeEach(() => {
    vi.mocked(prisma.character.findUnique).mockReset();
    vi.mocked(prisma.customItem.findUnique).mockReset();
    vi.mocked(prisma.uniqueItem.findUnique).mockReset();
    vi.mocked(prisma.gameCharacter.findMany).mockReset();
    vi.mocked(prisma.gameCharacter.findFirst).mockReset();
  });

  it("rejects same character", async () => {
    const r = await validateInventoryTransferParties(
      "a",
      "a",
      "GLOBAL_ITEM",
      "i1"
    );
    expect(r?.status).toBe(400);
  });

  it("rejects missing recipient", async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue(null);
    const r = await validateInventoryTransferParties(
      "a",
      "b",
      "GLOBAL_ITEM",
      "i1"
    );
    expect(r?.status).toBe(404);
  });

  it("requires both in custom item game", async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      id: "b",
    } as never);
    vi.mocked(prisma.customItem.findUnique).mockResolvedValue({
      gameId: "g1",
    } as never);
    vi.mocked(prisma.gameCharacter.findFirst).mockImplementation((async (args: {
      where: { characterId: string };
    }) => {
      if (args.where.characterId === "a") return { id: "gc-a" };
      return null;
    }) as unknown as typeof prisma.gameCharacter.findFirst);
    const r = await validateInventoryTransferParties(
      "a",
      "b",
      "CUSTOM_ITEM",
      "c1"
    );
    expect(r?.status).toBe(403);
  });

  it("allows custom item when both in game", async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      id: "b",
    } as never);
    vi.mocked(prisma.customItem.findUnique).mockResolvedValue({
      gameId: "g1",
    } as never);
    vi.mocked(prisma.gameCharacter.findFirst).mockResolvedValue({
      id: "gc",
    } as never);
    const r = await validateInventoryTransferParties(
      "a",
      "b",
      "CUSTOM_ITEM",
      "c1"
    );
    expect(r).toBeNull();
    expect(prisma.gameCharacter.findFirst).toHaveBeenCalled();
  });

  it("requires shared game for global items", async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      id: "b",
    } as never);
    vi.mocked(prisma.gameCharacter.findMany).mockResolvedValue([
      { gameId: "g1" },
    ] as never);
    vi.mocked(prisma.gameCharacter.findFirst).mockResolvedValue(null as never);
    const r = await validateInventoryTransferParties(
      "a",
      "b",
      "GLOBAL_ITEM",
      "i1"
    );
    expect(r?.status).toBe(403);
  });
});
