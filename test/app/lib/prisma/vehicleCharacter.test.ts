import { beforeEach, describe, expect, it, vi } from "vitest";

const vehicleFindUnique = vi.fn();
const customVehicleFindUnique = vi.fn();
const uniqueVehicleFindUnique = vi.fn();
const vehicleMountedItemFindMany = vi.fn();
const itemCharacterFindMany = vi.fn();
const characterFindMany = vi.fn();

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    vehicle: {
      findUnique: (...args: unknown[]) => vehicleFindUnique(...args),
    },
    customVehicle: {
      findUnique: (...args: unknown[]) => customVehicleFindUnique(...args),
    },
    uniqueVehicle: {
      findUnique: (...args: unknown[]) => uniqueVehicleFindUnique(...args),
    },
    vehicleMountedItem: {
      findMany: (...args: unknown[]) => vehicleMountedItemFindMany(...args),
    },
    itemCharacter: {
      findMany: (...args: unknown[]) => itemCharacterFindMany(...args),
    },
    character: {
      findMany: (...args: unknown[]) => characterFindMany(...args),
      findUnique: vi.fn(),
    },
  },
}));

type VehicleRow = {
  id: string;
  accessType: "PLAYER" | "GAME_MASTER";
  name: string;
  brand: string | null;
  year: number | null;
  imageKey: string | null;
  confCost: number;
  costInfo: string | null;
  description: string;
  notes: string | null;
  maxHp: number;
  travelSpeedKmh: number;
  combatSpeedMetres: number;
  manoeuvrability: number;
  acceleration: number;
  weight: number | null;
  heightMetres: number | null;
  maxCargoWeightKg: number | null;
  maxMountedItems: number | null;
  maxPassengers: number;
  locomotionModes: Array<"LAND" | "AIR" | "SEA" | "SNOW">;
  vehicleSizeCategory: "LIGHT" | "STANDARD" | "HEAVY";
  protectedFromOfficialImport: boolean;
};

type CustomVehicleRow = Omit<
  VehicleRow,
  "accessType" | "protectedFromOfficialImport"
> & {
  gameId: string;
  confCost: number | null;
  description: string | null;
};

type UniqueVehicleRow = {
  id: string;
  ownerUserId: string;
  gameId: string;
  sourceType:
    | "GLOBAL_VEHICLE"
    | "CUSTOM_VEHICLE"
    | "UNIQUE_VEHICLE"
    | "STANDALONE";
  vehicleId: string | null;
  nameOverride: string | null;
  brandOverride: string | null;
  yearOverride: number | null;
  imageKeyOverride: string | null;
  confCostOverride: number | null;
  costInfoOverride: string | null;
  descriptionOverride: string | null;
  notesOverride: string | null;
  maxHpOverride: number | null;
  travelSpeedKmhOverride: number | null;
  combatSpeedMetresOverride: number | null;
  manoeuvrabilityOverride: number | null;
  accelerationOverride: number | null;
  weightOverride: number | null;
  heightMetresOverride: number | null;
  maxCargoWeightKgOverride: number | null;
  maxMountedItemsOverride: number | null;
  maxPassengersOverride: number | null;
  locomotionModesOverride: unknown;
  vehicleSizeCategoryOverride: "LIGHT" | "STANDARD" | "HEAVY" | null;
  specialTag: string | null;
};

type VehicleCharacterRow = {
  id: string;
  characterId: string;
  sourceType: "GLOBAL_VEHICLE" | "CUSTOM_VEHICLE" | "UNIQUE_VEHICLE";
  vehicleId: string;
  customName: string | null;
  currentHp: number;
  maxHpBonus: number;
  isBeyondRepair: boolean;
  parkedAt: string | null;
  notes: string | null;
  passengerCharacterIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

function baseVehicle(
  overrides: Partial<VehicleRow> & Pick<VehicleRow, "id" | "name">
): VehicleRow {
  return {
    id: overrides.id,
    accessType: "PLAYER",
    name: overrides.name,
    brand: null,
    year: null,
    imageKey: null,
    confCost: 1000,
    costInfo: null,
    description: "Base vehicle",
    notes: null,
    maxHp: 12,
    travelSpeedKmh: 120,
    combatSpeedMetres: 18,
    manoeuvrability: 2,
    acceleration: 1,
    weight: null,
    heightMetres: null,
    maxCargoWeightKg: null,
    maxMountedItems: null,
    maxPassengers: 1,
    locomotionModes: ["LAND"],
    vehicleSizeCategory: "LIGHT",
    protectedFromOfficialImport: false,
    ...overrides,
  };
}

function baseCustomVehicle(
  overrides: Partial<CustomVehicleRow> &
    Pick<CustomVehicleRow, "id" | "name" | "gameId">
): CustomVehicleRow {
  return {
    id: overrides.id,
    gameId: overrides.gameId,
    name: overrides.name,
    brand: null,
    year: null,
    imageKey: null,
    confCost: null,
    costInfo: null,
    description: null,
    notes: null,
    maxHp: 20,
    travelSpeedKmh: 90,
    combatSpeedMetres: 12,
    manoeuvrability: 1,
    acceleration: 1,
    weight: null,
    heightMetres: null,
    maxCargoWeightKg: null,
    maxMountedItems: null,
    maxPassengers: 4,
    locomotionModes: ["SNOW"],
    vehicleSizeCategory: "STANDARD",
    ...overrides,
  };
}

function baseUniqueVehicle(
  overrides: Partial<UniqueVehicleRow> &
    Pick<UniqueVehicleRow, "id" | "sourceType" | "gameId"> & {
      vehicleId?: string | null;
    }
): UniqueVehicleRow {
  return {
    id: overrides.id,
    ownerUserId: "user-1",
    gameId: overrides.gameId,
    sourceType: overrides.sourceType,
    vehicleId: overrides.vehicleId ?? null,
    nameOverride: null,
    brandOverride: null,
    yearOverride: null,
    imageKeyOverride: null,
    confCostOverride: null,
    costInfoOverride: null,
    descriptionOverride: null,
    notesOverride: null,
    maxHpOverride: null,
    travelSpeedKmhOverride: null,
    combatSpeedMetresOverride: null,
    manoeuvrabilityOverride: null,
    accelerationOverride: null,
    weightOverride: null,
    heightMetresOverride: null,
    maxCargoWeightKgOverride: null,
    maxMountedItemsOverride: null,
    maxPassengersOverride: null,
    locomotionModesOverride: null,
    vehicleSizeCategoryOverride: null,
    specialTag: null,
    ...overrides,
  };
}

function baseVehicleCharacter(
  overrides: Partial<VehicleCharacterRow> &
    Pick<
      VehicleCharacterRow,
      "id" | "characterId" | "sourceType" | "vehicleId" | "currentHp"
    >
): VehicleCharacterRow {
  return {
    id: overrides.id,
    characterId: overrides.characterId,
    sourceType: overrides.sourceType,
    vehicleId: overrides.vehicleId,
    customName: null,
    currentHp: overrides.currentHp,
    maxHpBonus: 0,
    isBeyondRepair: false,
    parkedAt: null,
    notes: null,
    passengerCharacterIds: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("vehicleCharacter helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vehicleMountedItemFindMany.mockResolvedValue([]);
    itemCharacterFindMany.mockResolvedValue([]);
    characterFindMany.mockResolvedValue([]);
  });

  it("calculates effective max HP from resolved maxHp and bonus", async () => {
    const { getEffectiveVehicleMaxHp } =
      await import("@/app/lib/prisma/vehicleCharacter");
    expect(
      getEffectiveVehicleMaxHp({
        maxHpBonus: 4,
        vehicle: { maxHp: 12 },
      })
    ).toBe(16);
    expect(
      getEffectiveVehicleMaxHp({
        maxHpBonus: 4,
        vehicle: null,
      })
    ).toBeNull();
  });

  it("derives status from HP and beyond-repair flag", async () => {
    const { getDerivedVehicleStatus } =
      await import("@/app/lib/prisma/vehicleCharacter");
    expect(
      getDerivedVehicleStatus({ currentHp: 3, isBeyondRepair: false })
    ).toBe("OPERATIONAL");
    expect(
      getDerivedVehicleStatus({ currentHp: 0, isBeyondRepair: false })
    ).toBe("BROKEN_DOWN");
    expect(
      getDerivedVehicleStatus({ currentHp: 8, isBeyondRepair: true })
    ).toBe("BEYOND_REPAIR");
  });

  it("allows riding only while operational", async () => {
    const { canVehicleBeRidden } =
      await import("@/app/lib/prisma/vehicleCharacter");
    expect(canVehicleBeRidden({ currentHp: 1, isBeyondRepair: false })).toBe(
      true
    );
    expect(canVehicleBeRidden({ currentHp: 0, isBeyondRepair: false })).toBe(
      false
    );
    expect(canVehicleBeRidden({ currentHp: 5, isBeyondRepair: true })).toBe(
      false
    );
  });

  it("resolves a global vehicle", async () => {
    vehicleFindUnique.mockResolvedValue(
      baseVehicle({ id: "veh-1", name: "Bike" })
    );
    const { resolveVehicle } =
      await import("@/app/lib/prisma/vehicleCharacter");
    await expect(
      resolveVehicle("GLOBAL_VEHICLE", "veh-1")
    ).resolves.toMatchObject({
      id: "veh-1",
      name: "Bike",
      accessType: "PLAYER",
      maxHp: 12,
    });
  });

  it("resolves a custom vehicle", async () => {
    customVehicleFindUnique.mockResolvedValue(
      baseCustomVehicle({ id: "cust-1", gameId: "game-1", name: "Sled" })
    );
    const { resolveVehicle } =
      await import("@/app/lib/prisma/vehicleCharacter");
    await expect(
      resolveVehicle("CUSTOM_VEHICLE", "cust-1")
    ).resolves.toMatchObject({
      id: "cust-1",
      name: "Sled",
      gameId: "game-1",
      locomotionModes: ["SNOW"],
    });
  });

  it("resolves a unique vehicle by merging template overrides", async () => {
    uniqueVehicleFindUnique.mockResolvedValue(
      baseUniqueVehicle({
        id: "uniq-1",
        gameId: "game-1",
        sourceType: "GLOBAL_VEHICLE",
        vehicleId: "veh-1",
        nameOverride: "Reinforced Bike",
        maxHpOverride: 20,
        locomotionModesOverride: ["LAND", "SNOW"],
        specialTag: "PROTOTYPE",
      })
    );
    vehicleFindUnique.mockResolvedValue(
      baseVehicle({ id: "veh-1", name: "Bike" })
    );

    const { resolveVehicle } =
      await import("@/app/lib/prisma/vehicleCharacter");
    await expect(
      resolveVehicle("UNIQUE_VEHICLE", "uniq-1")
    ).resolves.toMatchObject({
      id: "veh-1",
      name: "Reinforced Bike",
      maxHp: 20,
      locomotionModes: ["LAND", "SNOW"],
      specialTag: "PROTOTYPE",
      _resolvedFrom: "UNIQUE_VEHICLE",
      _uniqueVehicleId: "uniq-1",
      gameId: "game-1",
    });
  });

  it("hydrates vehicle rows with resolved data and derived fields", async () => {
    vehicleFindUnique.mockResolvedValue(
      baseVehicle({ id: "veh-2", name: "Courier Bike", maxHp: 12 })
    );
    const { hydrateVehicleCharacters } =
      await import("@/app/lib/prisma/vehicleCharacter");

    const records = [
      baseVehicleCharacter({
        id: "vc-1",
        characterId: "char-1",
        sourceType: "GLOBAL_VEHICLE",
        vehicleId: "veh-2",
        currentHp: 0,
        maxHpBonus: 3,
      }),
    ];

    await expect(hydrateVehicleCharacters(records)).resolves.toEqual([
      expect.objectContaining({
        id: "vc-1",
        effectiveMaxHp: 15,
        derivedStatus: "BROKEN_DOWN",
        canBeRidden: false,
        mountedItems: [],
        cargoItems: [],
        cargoWeightKg: 0,
        passengers: [],
        occupantCount: 0,
        driverPresent: false,
        passengerCharacterIds: [],
        vehicle: expect.objectContaining({ name: "Courier Bike" }),
      }),
    ]);
  });
});
