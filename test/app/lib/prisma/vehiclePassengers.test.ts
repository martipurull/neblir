import { beforeEach, describe, expect, it, vi } from "vitest";

const vehicleCharacterFindFirst = vi.fn();
const characterFindUnique = vi.fn();
const charactersShareAnyGame = vi.fn();

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    vehicleCharacter: {
      findFirst: (...args: unknown[]) => vehicleCharacterFindFirst(...args),
    },
    character: {
      findUnique: (...args: unknown[]) => characterFindUnique(...args),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  charactersShareAnyGame: (...args: unknown[]) =>
    charactersShareAnyGame(...args),
}));

describe("addPassengerToVehicle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vehicleCharacterFindFirst.mockResolvedValue({
      id: "vc-1",
      characterId: "char-1",
      currentHp: 10,
      isBeyondRepair: false,
      passengerCharacterIds: [],
    });
    charactersShareAnyGame.mockResolvedValue(true);
    characterFindUnique.mockImplementation(
      async (args: { where: { id: string } }) => {
        if (args.where.id === "char-2") {
          return { id: "char-2", activeVehicleCharacterId: null };
        }
        return { id: "char-1", activeVehicleCharacterId: null };
      }
    );
  });

  it("rejects passengers while the owner is not driving", async () => {
    const { addPassengerToVehicle, VehiclePassengerConflictError } =
      await import("@/app/lib/prisma/vehiclePassengers");

    await expect(
      addPassengerToVehicle({
        ownerCharacterId: "char-1",
        vehicleCharacterId: "vc-1",
        passengerCharacterId: "char-2",
        maxPassengers: 2,
      })
    ).rejects.toBeInstanceOf(VehiclePassengerConflictError);
  });
});
