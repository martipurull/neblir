import type { UniqueItem } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const uniqueItemFindUnique = vi.fn();
const uniqueItemFindMany = vi.fn();
const itemFindUnique = vi.fn();
const customItemFindUnique = vi.fn();

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    uniqueItem: {
      findUnique: (...args: unknown[]) => uniqueItemFindUnique(...args),
      findMany: (...args: unknown[]) => uniqueItemFindMany(...args),
    },
    item: {
      findUnique: (...args: unknown[]) => itemFindUnique(...args),
    },
    customItem: {
      findUnique: (...args: unknown[]) => customItemFindUnique(...args),
    },
  },
}));

function minimalUniqueRow(
  overrides: Partial<UniqueItem> & Pick<UniqueItem, "id" | "sourceType">
): UniqueItem {
  return {
    ownerUserId: "owner-1",
    gameId: null,
    itemId: null,
    attackRollOverride: [],
    attackMeleeBonusOverride: null,
    attackRangeBonusOverride: null,
    attackThrowBonusOverride: null,
    defenceMeleeBonusOverride: null,
    defenceRangeBonusOverride: null,
    gridAttackBonusOverride: null,
    gridDefenceBonusOverride: null,
    confCostOverride: null,
    costInfoOverride: null,
    damageOverride: null,
    descriptionOverride: null,
    imageKeyOverride: null,
    nameOverride: null,
    usageOverride: null,
    weightOverride: null,
    notesOverride: null,
    specialTag: null,
    equippableOverride: null,
    equipSlotTypesOverride: null,
    equipSlotCostOverride: null,
    maxUsesOverride: null,
    ...overrides,
  } as UniqueItem;
}

describe("buildStandaloneResolvedItem", () => {
  it("maps name and weight from overrides", async () => {
    const { buildStandaloneResolvedItem } = await import(
      "@/app/lib/prisma/uniqueItem"
    );
    const row = minimalUniqueRow({
      id: "u-1",
      sourceType: "STANDALONE",
      nameOverride: "Mysterious bracelet",
      weightOverride: 0.25,
    });
    const r = buildStandaloneResolvedItem(row);
    expect(r.name).toBe("Mysterious bracelet");
    expect(r.weight).toBe(0.25);
    expect(r.type).toBe("GENERAL_ITEM");
    expect(r.accessType).toBe("PLAYER");
    expect(r._uniqueItemId).toBe("u-1");
    expect(r._resolvedFrom).toBe("UNIQUE_ITEM");
    expect(r.description).toBe("");
    expect(r.equippable).toBe(false);
    expect(r.attackRoll).toEqual([]);
  });

  it("uses Unknown item when name is blank after trim", async () => {
    const { buildStandaloneResolvedItem } = await import(
      "@/app/lib/prisma/uniqueItem"
    );
    const row = minimalUniqueRow({
      id: "u-2",
      sourceType: "STANDALONE",
      nameOverride: "   ",
      weightOverride: 1,
    });
    expect(buildStandaloneResolvedItem(row).name).toBe("Unknown item");
  });

  it("uses weight 0 when weightOverride is null", async () => {
    const { buildStandaloneResolvedItem } = await import(
      "@/app/lib/prisma/uniqueItem"
    );
    const row = minimalUniqueRow({
      id: "u-3",
      sourceType: "STANDALONE",
      nameOverride: "Thing",
      weightOverride: null,
    });
    expect(buildStandaloneResolvedItem(row).weight).toBe(0);
  });

  it("includes equip slot types from JSON override when array", async () => {
    const { buildStandaloneResolvedItem } = await import(
      "@/app/lib/prisma/uniqueItem"
    );
    const row = minimalUniqueRow({
      id: "u-4",
      sourceType: "STANDALONE",
      nameOverride: "Ring",
      weightOverride: 0,
      equipSlotTypesOverride: [
        "HAND",
      ] as unknown as UniqueItem["equipSlotTypesOverride"],
      equippableOverride: true,
    });
    expect(buildStandaloneResolvedItem(row).equipSlotTypes).toEqual(["HAND"]);
    expect(buildStandaloneResolvedItem(row).equippable).toBe(true);
  });
});

describe("prismaDataFromUniqueItemCreate", () => {
  it("omits itemId for STANDALONE", async () => {
    const { prismaDataFromUniqueItemCreate } = await import(
      "@/app/lib/prisma/uniqueItem"
    );
    const data = prismaDataFromUniqueItemCreate("user-1", undefined, {
      sourceType: "STANDALONE",
      nameOverride: "A",
      weightOverride: 2,
    });
    expect(data.sourceType).toBe("STANDALONE");
    expect(data).not.toHaveProperty("itemId");
    expect(data.ownerUserId).toBe("user-1");
    expect(data.nameOverride).toBe("A");
    expect(data.weightOverride).toBe(2);
  });

  it("includes itemId for GLOBAL_ITEM", async () => {
    const { prismaDataFromUniqueItemCreate } = await import(
      "@/app/lib/prisma/uniqueItem"
    );
    const data = prismaDataFromUniqueItemCreate("user-1", "g-1", {
      sourceType: "GLOBAL_ITEM",
      itemId: "item-xyz",
    });
    expect(data.itemId).toBe("item-xyz");
    expect(data.gameId).toBe("g-1");
    expect(data.sourceType).toBe("GLOBAL_ITEM");
  });
});

describe("getResolvedUniqueItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when unique row is missing", async () => {
    uniqueItemFindUnique.mockResolvedValue(null);
    const { getResolvedUniqueItem } = await import(
      "@/app/lib/prisma/uniqueItem"
    );
    await expect(getResolvedUniqueItem("missing")).resolves.toBeNull();
  });

  it("returns standalone bundle when sourceType is STANDALONE", async () => {
    const row = minimalUniqueRow({
      id: "u-s",
      sourceType: "STANDALONE",
      nameOverride: "Charm",
      weightOverride: 0.01,
    });
    uniqueItemFindUnique.mockResolvedValue(row);
    const { getResolvedUniqueItem } = await import(
      "@/app/lib/prisma/uniqueItem"
    );
    const out = await getResolvedUniqueItem("u-s");
    expect(out?.templateItem).toBeNull();
    expect(out?.resolvedItem).toMatchObject({
      name: "Charm",
      weight: 0.01,
      type: "GENERAL_ITEM",
    });
    expect(itemFindUnique).not.toHaveBeenCalled();
  });

  it("returns null resolvedItem when template row missing itemId", async () => {
    const row = minimalUniqueRow({
      id: "u-bad",
      sourceType: "GLOBAL_ITEM",
      itemId: null,
    });
    uniqueItemFindUnique.mockResolvedValue(row);
    const { getResolvedUniqueItem } = await import(
      "@/app/lib/prisma/uniqueItem"
    );
    const out = await getResolvedUniqueItem("u-bad");
    expect(out?.templateItem).toBeNull();
    expect(out?.resolvedItem).toBeNull();
  });

  it("loads global template and merges overrides", async () => {
    const row = minimalUniqueRow({
      id: "u-g",
      sourceType: "GLOBAL_ITEM",
      itemId: "tpl-1",
      nameOverride: "Renamed",
      weightOverride: 3,
    });
    uniqueItemFindUnique.mockResolvedValue(row);
    itemFindUnique.mockResolvedValue({
      id: "tpl-1",
      name: "Base knife",
      type: "WEAPON",
      weight: 1,
      description: "Sharp",
    });
    const { getResolvedUniqueItem } = await import(
      "@/app/lib/prisma/uniqueItem"
    );
    const out = await getResolvedUniqueItem("u-g");
    expect(out?.templateItem).toEqual(
      expect.objectContaining({ id: "tpl-1", name: "Base knife" })
    );
    expect(out?.resolvedItem).toMatchObject({
      name: "Renamed",
      weight: 3,
    });
    expect(itemFindUnique).toHaveBeenCalledWith({
      where: { id: "tpl-1" },
    });
    expect(customItemFindUnique).not.toHaveBeenCalled();
  });

  it("returns null resolvedItem when global template not found", async () => {
    const row = minimalUniqueRow({
      id: "u-g2",
      sourceType: "GLOBAL_ITEM",
      itemId: "gone",
    });
    uniqueItemFindUnique.mockResolvedValue(row);
    itemFindUnique.mockResolvedValue(null);
    const { getResolvedUniqueItem } = await import(
      "@/app/lib/prisma/uniqueItem"
    );
    const out = await getResolvedUniqueItem("u-g2");
    expect(out?.resolvedItem).toBeNull();
    expect(out?.templateItem).toBeNull();
  });

  it("loads custom template when sourceType is CUSTOM_ITEM", async () => {
    const row = minimalUniqueRow({
      id: "u-c",
      sourceType: "CUSTOM_ITEM",
      itemId: "cust-1",
    });
    uniqueItemFindUnique.mockResolvedValue(row);
    customItemFindUnique.mockResolvedValue({
      id: "cust-1",
      name: "GM brew",
      weight: 0.5,
    });
    const { getResolvedUniqueItem } = await import(
      "@/app/lib/prisma/uniqueItem"
    );
    const out = await getResolvedUniqueItem("u-c");
    expect(out?.templateItem).toEqual(
      expect.objectContaining({ id: "cust-1", name: "GM brew" })
    );
    expect(customItemFindUnique).toHaveBeenCalledWith({
      where: { id: "cust-1" },
    });
    expect(itemFindUnique).not.toHaveBeenCalled();
  });
});

describe("getUniqueItemsByGameId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses display name from nameOverride when set", async () => {
    uniqueItemFindMany.mockResolvedValue([
      {
        id: "a",
        nameOverride: "Shown",
        sourceType: "STANDALONE",
        itemId: null,
      },
    ]);
    const { getUniqueItemsByGameId } = await import(
      "@/app/lib/prisma/uniqueItem"
    );
    const list = await getUniqueItemsByGameId("g-1");
    expect(list).toEqual([{ id: "a", name: "Shown" }]);
  });

  it("uses Unnamed item for STANDALONE without nameOverride", async () => {
    uniqueItemFindMany.mockResolvedValue([
      {
        id: "b",
        nameOverride: null,
        sourceType: "STANDALONE",
        itemId: null,
      },
    ]);
    const { getUniqueItemsByGameId } = await import(
      "@/app/lib/prisma/uniqueItem"
    );
    const list = await getUniqueItemsByGameId("g-1");
    expect(list).toEqual([{ id: "b", name: "Unnamed item" }]);
  });

  it("resolves GLOBAL_ITEM name from Item when override empty", async () => {
    uniqueItemFindMany.mockResolvedValue([
      {
        id: "c",
        nameOverride: "",
        sourceType: "GLOBAL_ITEM",
        itemId: "it-1",
      },
    ]);
    itemFindUnique.mockResolvedValue({ name: "Rifle" });
    const { getUniqueItemsByGameId } = await import(
      "@/app/lib/prisma/uniqueItem"
    );
    const list = await getUniqueItemsByGameId("g-1");
    expect(list).toEqual([{ id: "c", name: "Rifle" }]);
  });

  it("passes ownerUserId filter into findMany when provided", async () => {
    uniqueItemFindMany.mockResolvedValue([]);
    const { getUniqueItemsByGameId } = await import(
      "@/app/lib/prisma/uniqueItem"
    );
    await getUniqueItemsByGameId("g-1", "user-99");
    expect(uniqueItemFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerUserId: "user-99",
        }),
      })
    );
  });
});
