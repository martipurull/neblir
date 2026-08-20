import { describe, expect, it } from "vitest";
import {
  activeVehiclePatchSchema,
  customVehicleCreateSchema,
  uniqueVehicleCreateSchema,
  vehicleCharacterPatchSchema,
  vehicleSchema,
} from "@/app/lib/types/vehicle";

describe("vehicleSchema", () => {
  it("accepts an official vehicle with at least one locomotion mode", () => {
    const result = vehicleSchema.safeParse({
      accessType: "PLAYER",
      name: "Courier Bike",
      confCost: 1200,
      description: "A fast city bike.",
      maxHp: 12,
      travelSpeedKmh: 140,
      combatSpeedMetres: 20,
      manoeuvrability: 3,
      acceleration: 1,
      maxPassengers: 1,
      locomotionModes: ["LAND"],
      vehicleSizeCategory: "LIGHT",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a vehicle with no locomotion modes", () => {
    const result = vehicleSchema.safeParse({
      accessType: "PLAYER",
      name: "Broken Concept",
      confCost: 10,
      description: "",
      maxHp: 1,
      travelSpeedKmh: 1,
      combatSpeedMetres: 1,
      manoeuvrability: 0,
      acceleration: 1,
      maxPassengers: 1,
      locomotionModes: [],
      vehicleSizeCategory: "LIGHT",
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate locomotion modes", () => {
    const result = vehicleSchema.safeParse({
      accessType: "PLAYER",
      name: "Hover Skiff",
      confCost: 5000,
      description: "Skims over anything.",
      maxHp: 20,
      travelSpeedKmh: 180,
      combatSpeedMetres: 24,
      manoeuvrability: 4,
      acceleration: 1,
      maxPassengers: 2,
      locomotionModes: ["LAND", "LAND"],
      vehicleSizeCategory: "STANDARD",
    });
    expect(result.success).toBe(false);
  });
});

describe("customVehicleCreateSchema", () => {
  it("requires at least one locomotion mode", () => {
    const result = customVehicleCreateSchema.safeParse({
      gameId: "game-1",
      name: "Snow Cat",
      maxHp: 16,
      travelSpeedKmh: 60,
      combatSpeedMetres: 10,
      manoeuvrability: 2,
      acceleration: 1,
      maxPassengers: 4,
      locomotionModes: ["SNOW"],
      vehicleSizeCategory: "STANDARD",
    });
    expect(result.success).toBe(true);
  });
});

describe("uniqueVehicleCreateSchema", () => {
  it("accepts GLOBAL_VEHICLE with gameId and vehicleId", () => {
    const result = uniqueVehicleCreateSchema.safeParse({
      gameId: "game-1",
      sourceType: "GLOBAL_VEHICLE",
      vehicleId: "veh-1",
    });
    expect(result.success).toBe(true);
  });

  it("accepts CUSTOM_VEHICLE with override fields", () => {
    const result = uniqueVehicleCreateSchema.safeParse({
      gameId: "game-1",
      sourceType: "CUSTOM_VEHICLE",
      vehicleId: "veh-2",
      nameOverride: "Reinforced Snow Cat",
      locomotionModesOverride: ["SNOW", "LAND"],
      maxPassengersOverride: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects GLOBAL_VEHICLE without vehicleId", () => {
    const result = uniqueVehicleCreateSchema.safeParse({
      gameId: "game-1",
      sourceType: "GLOBAL_VEHICLE",
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate locomotion override entries", () => {
    const result = uniqueVehicleCreateSchema.safeParse({
      gameId: "game-1",
      sourceType: "GLOBAL_VEHICLE",
      vehicleId: "veh-1",
      locomotionModesOverride: ["AIR", "AIR"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts STANDALONE without vehicleId and with full stat overrides", () => {
    const result = uniqueVehicleCreateSchema.safeParse({
      gameId: "game-1",
      sourceType: "STANDALONE",
      nameOverride: "Custom Flyer",
      confCostOverride: 5000,
      descriptionOverride: "One-off airframe.",
      maxHpOverride: 18,
      travelSpeedKmhOverride: 200,
      combatSpeedMetresOverride: 30,
      manoeuvrabilityOverride: 4,
      accelerationOverride: 2,
      maxPassengersOverride: 2,
      locomotionModesOverride: ["AIR"],
      vehicleSizeCategoryOverride: "LIGHT",
    });
    expect(result.success).toBe(true);
  });

  it("rejects STANDALONE when required stat overrides are missing", () => {
    const result = uniqueVehicleCreateSchema.safeParse({
      gameId: "game-1",
      sourceType: "STANDALONE",
      nameOverride: "Incomplete",
    });
    expect(result.success).toBe(false);
  });
});

describe("vehicleCharacterPatchSchema", () => {
  it("accepts HP adjustment actions", () => {
    const result = vehicleCharacterPatchSchema.safeParse({
      action: "adjustHp",
      amount: -3,
    });
    expect(result.success).toBe(true);
  });

  it("requires parkedAt for setParkedAt", () => {
    const result = vehicleCharacterPatchSchema.safeParse({
      action: "setParkedAt",
      parkedAt: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("activeVehiclePatchSchema", () => {
  it("accepts mount actions", () => {
    const result = activeVehiclePatchSchema.safeParse({
      action: "mount",
      vehicleCharacterId: "vc-1",
    });
    expect(result.success).toBe(true);
  });

  it("requires parkedAt for dismount", () => {
    const result = activeVehiclePatchSchema.safeParse({
      action: "dismount",
      parkedAt: "",
    });
    expect(result.success).toBe(false);
  });
});
