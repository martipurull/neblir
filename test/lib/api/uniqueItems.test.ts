import { afterEach, describe, expect, it, vi } from "vitest";
import { getUniqueItemById, updateUniqueItem } from "@/lib/api/uniqueItems";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const updatedRecord = {
  id: "ui-1",
  ownerUserId: "user-1",
  gameId: "game-1",
  sourceType: "GLOBAL_ITEM" as const,
  itemId: "item-1",
  attackRollOverride: [],
  notesOverride: "kept",
};

describe("updateUniqueItem", () => {
  it("returns the updated record from a well-formed body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(updatedRecord))
    );

    await expect(
      updateUniqueItem("ui-1", { notesOverride: "kept" })
    ).resolves.toEqual(updatedRecord);
  });

  it("rejects a body that is missing id", async () => {
    const { id: _id, ...withoutId } = updatedRecord;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(withoutId)));

    await expect(
      updateUniqueItem("ui-1", { notesOverride: "kept" })
    ).rejects.toThrow(/id:/);
  });
});

const uniqueItemDetail = {
  id: "ui-1",
  ownerUserId: "user-1",
  gameId: "game-1",
  sourceType: "STANDALONE" as const,
  itemId: null,
  attackRollOverride: [],
  nameOverride: "Shard",
  weightOverride: 0.5,
  templateItem: null,
  resolvedItem: {
    id: "ui-1",
    type: "GENERAL_ITEM" as const,
    accessType: "PLAYER" as const,
    name: "Shard",
    imageKey: null,
    confCost: 0,
    costInfo: null,
    description: "",
    notes: null,
    weight: 0.5,
    usage: null,
    attackRoll: [],
    attackMeleeBonus: null,
    attackRangeBonus: null,
    attackThrowBonus: null,
    defenceMeleeBonus: null,
    defenceRangeBonus: null,
    gridAttackBonus: null,
    gridDefenceBonus: null,
    effectiveRange: null,
    maxRange: null,
    damage: null,
    equippable: false,
    equipSlotTypes: [],
    equipSlotCost: null,
    vehicleMountable: false,
    maxUses: null,
    modifiesAttribute: null,
    attributeMod: null,
    modifiesSkill: null,
    skillMod: null,
    isSpeedAltered: false,
  },
};

describe("getUniqueItemById", () => {
  it("returns the unique item from a well-formed body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(uniqueItemDetail))
    );

    await expect(getUniqueItemById("ui-1")).resolves.toEqual(uniqueItemDetail);
  });

  it("rejects a body that is missing id", async () => {
    const { id: _id, ...withoutId } = uniqueItemDetail;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(withoutId)));

    await expect(getUniqueItemById("ui-1")).rejects.toThrow(/id:/);
  });

  it("returns a custom template from a well-formed body", async () => {
    const customDetail = {
      id: "ui-2",
      ownerUserId: "user-1",
      gameId: "game-1",
      sourceType: "CUSTOM_ITEM" as const,
      itemId: "ci-1",
      attackRollOverride: [],
      templateItem: {
        id: "ci-1",
        gameId: "game-1",
        name: "Kit",
        weight: 1,
        type: "GENERAL_ITEM" as const,
        attackRoll: [],
      },
      resolvedItem: {
        id: "ci-1",
        gameId: "game-1",
        name: "Kit",
        weight: 1,
        type: "GENERAL_ITEM" as const,
        attackRoll: [],
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(customDetail))
    );

    await expect(getUniqueItemById("ui-2")).resolves.toEqual(customDetail);
  });
});
