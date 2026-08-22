import { beforeEach, describe, expect, it, vi } from "vitest";

const vehicleCharacterFindFirst = vi.fn();
const itemCharacterFindFirst = vi.fn();
const itemCharacterFindMany = vi.fn();
const vehicleMountedItemFindUnique = vi.fn();
const vehicleMountedItemCount = vi.fn();
const vehicleMountedItemCreate = vi.fn();
const itemCharacterUpdate = vi.fn();
const hydrateItemCharacters = vi.fn();

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    vehicleCharacter: {
      findFirst: (...args: unknown[]) => vehicleCharacterFindFirst(...args),
    },
    itemCharacter: {
      findFirst: (...args: unknown[]) => itemCharacterFindFirst(...args),
      findMany: (...args: unknown[]) => itemCharacterFindMany(...args),
      update: (...args: unknown[]) => itemCharacterUpdate(...args),
    },
    vehicleMountedItem: {
      findUnique: (...args: unknown[]) => vehicleMountedItemFindUnique(...args),
      findMany: vi.fn().mockResolvedValue([]),
      count: (...args: unknown[]) => vehicleMountedItemCount(...args),
      create: (...args: unknown[]) => vehicleMountedItemCreate(...args),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        itemCharacter: {
          update: (...args: unknown[]) => itemCharacterUpdate(...args),
        },
        vehicleMountedItem: {
          create: (...args: unknown[]) => vehicleMountedItemCreate(...args),
        },
      }),
  },
}));

vi.mock("@/app/lib/prisma/itemCharacter", () => ({
  hydrateItemCharacters: (...args: unknown[]) => hydrateItemCharacters(...args),
}));

describe("attachItemToVehicle vehicleMountable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vehicleCharacterFindFirst.mockResolvedValue({
      id: "vc-1",
      characterId: "char-1",
    });
    itemCharacterFindFirst.mockResolvedValue({
      id: "ic-1",
      characterId: "char-1",
      status: "FUNCTIONAL",
      isEquipped: false,
      equipSlots: [],
      itemLocation: "carried",
    });
    itemCharacterFindMany.mockResolvedValue([
      {
        id: "ic-1",
        characterId: "char-1",
        status: "FUNCTIONAL",
        isEquipped: false,
        equipSlots: [],
        itemLocation: "carried",
      },
    ]);
    vehicleMountedItemFindUnique.mockResolvedValue(null);
    vehicleMountedItemCount.mockResolvedValue(0);
  });

  it("rejects items that are not vehicle-mountable", async () => {
    hydrateItemCharacters.mockResolvedValue([
      { id: "ic-1", item: { name: "Crowbar", vehicleMountable: false } },
    ]);
    const { attachItemToVehicle, VehicleMountedItemConflictError } =
      await import("@/app/lib/prisma/vehicleMountedItem");

    await expect(
      attachItemToVehicle({
        characterId: "char-1",
        vehicleCharacterId: "vc-1",
        itemCharacterId: "ic-1",
      })
    ).rejects.toBeInstanceOf(VehicleMountedItemConflictError);
  });

  it("rejects items that are not carried", async () => {
    itemCharacterFindFirst.mockResolvedValue({
      id: "ic-1",
      characterId: "char-1",
      status: "FUNCTIONAL",
      isEquipped: false,
      equipSlots: [],
      itemLocation: "locker",
    });
    hydrateItemCharacters.mockResolvedValue([
      { id: "ic-1", item: { name: "Turret", vehicleMountable: true } },
    ]);
    const { attachItemToVehicle, VehicleMountedItemConflictError } =
      await import("@/app/lib/prisma/vehicleMountedItem");

    await expect(
      attachItemToVehicle({
        characterId: "char-1",
        vehicleCharacterId: "vc-1",
        itemCharacterId: "ic-1",
      })
    ).rejects.toBeInstanceOf(VehicleMountedItemConflictError);
  });

  it("mounts vehicle-mountable carried items and sets stored location", async () => {
    hydrateItemCharacters.mockResolvedValue([
      { id: "ic-1", item: { name: "Turret", vehicleMountable: true } },
    ]);
    itemCharacterFindMany.mockResolvedValue([
      {
        id: "ic-1",
        characterId: "char-1",
        status: "FUNCTIONAL",
        isEquipped: false,
        equipSlots: [],
        itemLocation: "vehicle-mounted:vc-1",
      },
    ]);
    vehicleMountedItemCreate.mockResolvedValue({
      id: "mount-1",
      vehicleCharacterId: "vc-1",
      itemCharacterId: "ic-1",
      mountSlot: null,
      createdAt: new Date(),
    });

    const { attachItemToVehicle } =
      await import("@/app/lib/prisma/vehicleMountedItem");
    const result = await attachItemToVehicle({
      characterId: "char-1",
      vehicleCharacterId: "vc-1",
      itemCharacterId: "ic-1",
    });
    expect(result.id).toBe("mount-1");
    expect(itemCharacterUpdate).toHaveBeenCalledWith({
      where: { id: "ic-1" },
      data: {
        itemLocation: "vehicle-mounted:vc-1",
        isEquipped: false,
        equipSlots: [],
      },
    });
    expect(vehicleMountedItemCreate).toHaveBeenCalled();
  });
});
