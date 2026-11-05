import { beforeEach, describe, expect, it, vi } from "vitest";

const vehicleCharacterFindFirst = vi.fn();
const itemCharacterFindFirst = vi.fn();
const itemCharacterUpdate = vi.fn();
const vehicleMountedItemFindUnique = vi.fn();
const hydrateItemCharacters = vi.fn();

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    vehicleCharacter: {
      findFirst: (...args: unknown[]) => vehicleCharacterFindFirst(...args),
    },
    itemCharacter: {
      findFirst: (...args: unknown[]) => itemCharacterFindFirst(...args),
      update: (...args: unknown[]) => itemCharacterUpdate(...args),
    },
    vehicleMountedItem: {
      findUnique: (...args: unknown[]) => vehicleMountedItemFindUnique(...args),
    },
  },
}));

vi.mock("@/app/lib/prisma/itemCharacter", () => ({
  hydrateItemCharacters: (...args: unknown[]) => hydrateItemCharacters(...args),
}));

describe("vehicle cargo and the recorded game", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vehicleCharacterFindFirst.mockResolvedValue({
      id: "vc-1",
      characterId: "char-1",
    });
    itemCharacterUpdate.mockResolvedValue({});
    vehicleMountedItemFindUnique.mockResolvedValue(null);
    hydrateItemCharacters.mockResolvedValue([
      {
        id: "ic-1",
        quantity: 1,
        customName: null,
        status: "FUNCTIONAL",
        item: null,
      },
    ]);
  });

  it("clears the recorded game when an item is stowed as cargo", async () => {
    itemCharacterFindFirst.mockResolvedValue({
      id: "ic-1",
      characterId: "char-1",
      itemLocation: "Indira's Flat",
      stashGameId: "game-1",
      isEquipped: false,
      equipSlots: [],
      quantity: 1,
    });
    const { stowItemAsVehicleCargo } =
      await import("@/app/lib/prisma/vehicleCargo");

    await stowItemAsVehicleCargo({
      ownerCharacterId: "char-1",
      vehicleCharacterId: "vc-1",
      itemCharacterId: "ic-1",
      maxCargoWeightKg: null,
    });

    expect(itemCharacterUpdate).toHaveBeenCalledWith({
      where: { id: "ic-1" },
      data: {
        itemLocation: "vehicle:vc-1",
        isEquipped: false,
        equipSlots: [],
        stashGameId: null,
      },
    });
  });

  it("clears the recorded game when cargo is taken back", async () => {
    itemCharacterFindFirst.mockResolvedValue({
      id: "ic-1",
      characterId: "char-1",
      itemLocation: "vehicle:vc-1",
      stashGameId: "game-1",
    });
    const { retrieveItemFromVehicleCargo } =
      await import("@/app/lib/prisma/vehicleCargo");

    await retrieveItemFromVehicleCargo({
      ownerCharacterId: "char-1",
      vehicleCharacterId: "vc-1",
      itemCharacterId: "ic-1",
    });

    expect(itemCharacterUpdate).toHaveBeenCalledWith({
      where: { id: "ic-1" },
      data: { itemLocation: "carried", stashGameId: null },
    });
  });
});
