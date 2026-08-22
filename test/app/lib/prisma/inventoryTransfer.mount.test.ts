import { beforeEach, describe, expect, it, vi } from "vitest";

const itemCharacterFindFirst = vi.fn();
const itemCharacterDelete = vi.fn();
const itemCharacterUpdate = vi.fn();
const itemCharacterCreate = vi.fn();
const vehicleMountedItemDeleteMany = vi.fn();
const getMaxUsesForItem = vi.fn();

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    itemCharacter: {
      findFirst: (...args: unknown[]) => itemCharacterFindFirst(...args),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        itemCharacter: {
          findFirst: (...args: unknown[]) => itemCharacterFindFirst(...args),
          delete: (...args: unknown[]) => itemCharacterDelete(...args),
          update: (...args: unknown[]) => itemCharacterUpdate(...args),
          create: (...args: unknown[]) => itemCharacterCreate(...args),
        },
        vehicleMountedItem: {
          deleteMany: (...args: unknown[]) =>
            vehicleMountedItemDeleteMany(...args),
        },
      }),
  },
}));

vi.mock("@/app/lib/prisma/itemCharacter", () => ({
  getMaxUsesForItem: (...args: unknown[]) => getMaxUsesForItem(...args),
}));

describe("performInventoryItemTransfer mount cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMaxUsesForItem.mockResolvedValue(null);
    const sourceRow = {
      id: "ic-1",
      characterId: "from-char",
      quantity: 2,
      currentUses: 0,
      equipSlots: [] as string[],
      sourceType: "GLOBAL_ITEM" as const,
      itemId: "item-1",
      customName: null,
      status: "FUNCTIONAL" as const,
      itemLocation: "vehicle-mounted:vc-1",
    };
    itemCharacterFindFirst.mockImplementation(
      async (args: { where?: { id?: string; characterId?: string } }) => {
        if (args.where?.id === "ic-1") return sourceRow;
        if (args.where?.characterId === "to-char") return null;
        return null;
      }
    );
    vehicleMountedItemDeleteMany.mockResolvedValue({ count: 1 });
    itemCharacterUpdate.mockResolvedValue({});
    itemCharacterCreate.mockResolvedValue({});
  });

  it("detaches any vehicle mount when giving an inventory item", async () => {
    const { performInventoryItemTransfer } =
      await import("@/app/lib/prisma/inventoryTransfer");

    await performInventoryItemTransfer({
      fromCharacterId: "from-char",
      toCharacterId: "to-char",
      itemCharacterId: "ic-1",
      quantity: 1,
    });

    expect(vehicleMountedItemDeleteMany).toHaveBeenCalledWith({
      where: { itemCharacterId: "ic-1" },
    });
    expect(itemCharacterUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ic-1" },
        data: expect.objectContaining({
          itemLocation: "carried",
        }),
      })
    );
  });
});
