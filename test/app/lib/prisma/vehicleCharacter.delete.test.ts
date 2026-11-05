import { beforeEach, describe, expect, it, vi } from "vitest";

const vehicleCharacterFindUnique = vi.fn();
const itemCharacterUpdateMany = vi.fn();
const vehicleCharacterDelete = vi.fn();

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    vehicleCharacter: {
      findUnique: (...args: unknown[]) => vehicleCharacterFindUnique(...args),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        itemCharacter: {
          updateMany: (...args: unknown[]) => itemCharacterUpdateMany(...args),
        },
        vehicleCharacter: {
          delete: (...args: unknown[]) => vehicleCharacterDelete(...args),
        },
      }),
  },
}));

describe("deleteVehicleCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vehicleCharacterFindUnique.mockResolvedValue({
      id: "vc-1",
      characterId: "char-1",
    });
    itemCharacterUpdateMany.mockResolvedValue({ count: 1 });
    vehicleCharacterDelete.mockResolvedValue({ id: "vc-1" });
  });

  it("returns cargo and mounted items to hand and clears the recorded game", async () => {
    const { deleteVehicleCharacter } =
      await import("@/app/lib/prisma/vehicleCharacter");

    await deleteVehicleCharacter("vc-1");

    expect(itemCharacterUpdateMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { itemLocation: "vehicle-mounted:vc-1" },
          { characterId: "char-1", itemLocation: "vehicle:vc-1" },
        ],
      },
      data: {
        itemLocation: "carried",
        isEquipped: false,
        equipSlots: [],
        stashGameId: null,
      },
    });
  });
});
