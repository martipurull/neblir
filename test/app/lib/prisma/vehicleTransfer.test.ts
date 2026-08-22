import { beforeEach, describe, expect, it, vi } from "vitest";

const vehicleCharacterFindFirst = vi.fn();
const characterFindUnique = vi.fn();
const characterUpdate = vi.fn();
const vehicleMountedItemFindMany = vi.fn();
const itemCharacterUpdateMany = vi.fn();
const vehicleCharacterUpdate = vi.fn();

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    vehicleCharacter: {
      findFirst: (...args: unknown[]) => vehicleCharacterFindFirst(...args),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        character: {
          findUnique: (...args: unknown[]) => characterFindUnique(...args),
          update: (...args: unknown[]) => characterUpdate(...args),
        },
        vehicleMountedItem: {
          findMany: (...args: unknown[]) => vehicleMountedItemFindMany(...args),
        },
        itemCharacter: {
          updateMany: (...args: unknown[]) => itemCharacterUpdateMany(...args),
        },
        vehicleCharacter: {
          update: (...args: unknown[]) => vehicleCharacterUpdate(...args),
        },
      }),
  },
}));

describe("performVehicleTransfer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vehicleCharacterFindFirst.mockResolvedValue({
      id: "vc-1",
      characterId: "from-char",
      passengerCharacterIds: ["pass-1"],
      parkedAt: "Hangar",
    });
    characterFindUnique.mockResolvedValue({
      activeVehicleCharacterId: null,
    });
    vehicleMountedItemFindMany.mockResolvedValue([
      { itemCharacterId: "ic-mount-1" },
    ]);
    itemCharacterUpdateMany.mockResolvedValue({ count: 1 });
    vehicleCharacterUpdate.mockResolvedValue({});
    characterUpdate.mockResolvedValue({});
  });

  it("moves mounted items and cargo ownership to the recipient and keeps mount links", async () => {
    const { performVehicleTransfer } =
      await import("@/app/lib/prisma/vehicleTransfer");

    await performVehicleTransfer({
      fromCharacterId: "from-char",
      toCharacterId: "to-char",
      vehicleCharacterId: "vc-1",
    });

    expect(vehicleMountedItemFindMany).toHaveBeenCalledWith({
      where: { vehicleCharacterId: "vc-1" },
      select: { itemCharacterId: true },
    });

    expect(itemCharacterUpdateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["ic-mount-1"] },
        characterId: "from-char",
      },
      data: {
        characterId: "to-char",
        isEquipped: false,
        equipSlots: [],
      },
    });

    expect(itemCharacterUpdateMany).toHaveBeenCalledWith({
      where: {
        characterId: "from-char",
        itemLocation: "vehicle:vc-1",
      },
      data: {
        characterId: "to-char",
        isEquipped: false,
        equipSlots: [],
      },
    });

    expect(vehicleCharacterUpdate).toHaveBeenCalledWith({
      where: { id: "vc-1" },
      data: {
        characterId: "to-char",
        passengerCharacterIds: [],
        parkedAt: "Hangar",
      },
    });
  });

  it("throws when the vehicle is no longer owned by the giver", async () => {
    vehicleCharacterFindFirst.mockResolvedValue(null);
    const { performVehicleTransfer, VehicleTransferConflictError } =
      await import("@/app/lib/prisma/vehicleTransfer");

    await expect(
      performVehicleTransfer({
        fromCharacterId: "from-char",
        toCharacterId: "to-char",
        vehicleCharacterId: "vc-1",
      })
    ).rejects.toBeInstanceOf(VehicleTransferConflictError);
  });
});
