import { beforeEach, describe, expect, it, vi } from "vitest";

const vehicleCharacterFindUnique = vi.fn();
const vehicleCharacterFindMany = vi.fn();
const vehicleCharacterUpdate = vi.fn();
const vehicleCharacterDelete = vi.fn();
const characterFindUnique = vi.fn();
const characterUpdate = vi.fn();
const itemCharacterUpdateMany = vi.fn();

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    vehicleCharacter: {
      findUnique: (...args: unknown[]) => vehicleCharacterFindUnique(...args),
      findMany: (...args: unknown[]) => vehicleCharacterFindMany(...args),
      findFirst: vi.fn(),
      update: (...args: unknown[]) => vehicleCharacterUpdate(...args),
      delete: (...args: unknown[]) => vehicleCharacterDelete(...args),
      create: vi.fn(),
    },
    character: {
      findUnique: (...args: unknown[]) => characterFindUnique(...args),
      findMany: vi.fn(),
      update: (...args: unknown[]) => characterUpdate(...args),
    },
    itemCharacter: {
      findMany: vi.fn(),
      updateMany: (...args: unknown[]) => itemCharacterUpdateMany(...args),
    },
    vehicleMountedItem: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    vehicle: { findUnique: vi.fn() },
    customVehicle: { findUnique: vi.fn() },
    uniqueVehicle: { findUnique: vi.fn() },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        character: {
          findUnique: (...args: unknown[]) => characterFindUnique(...args),
          update: (...args: unknown[]) => characterUpdate(...args),
        },
        vehicleCharacter: {
          update: (...args: unknown[]) => vehicleCharacterUpdate(...args),
          delete: (...args: unknown[]) => vehicleCharacterDelete(...args),
        },
        itemCharacter: {
          updateMany: (...args: unknown[]) => itemCharacterUpdateMany(...args),
        },
      }),
  },
}));

vi.mock("@/app/lib/prisma/uniqueVehicle", () => ({
  resolveUniqueVehicle: vi.fn(),
}));

vi.mock("@/app/lib/prisma/vehicle", () => ({
  getCustomVehicle: vi.fn(),
  getVehicle: vi.fn(),
}));

describe("clearVehicleRiders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears guest riders and the owner when the vehicle cannot be ridden", async () => {
    vehicleCharacterFindUnique.mockResolvedValue({
      id: "vc-1",
      characterId: "char-1",
      passengerCharacterIds: ["char-2"],
    });
    characterFindUnique.mockImplementation(
      async (args: { where: { id: string } }) => ({
        activeVehicleCharacterId: "vc-1",
        id: args.where.id,
      })
    );

    const { clearVehicleRiders } =
      await import("@/app/lib/prisma/vehicleCharacter");
    await clearVehicleRiders("vc-1");

    expect(characterUpdate).toHaveBeenCalledWith({
      where: { id: "char-2" },
      data: { activeVehicleCharacterId: null },
    });
    expect(characterUpdate).toHaveBeenCalledWith({
      where: { id: "char-1" },
      data: { activeVehicleCharacterId: null },
    });
    expect(vehicleCharacterUpdate).toHaveBeenCalledWith({
      where: { id: "vc-1" },
      data: { passengerCharacterIds: [] },
    });
  });
});
