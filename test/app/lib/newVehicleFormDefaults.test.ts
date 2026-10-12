import { describe, expect, it } from "vitest";
import {
  customVehicleCreateFieldDefaults,
  officialVehicleCreateDefaults,
  standaloneUniqueVehicleCreateDefaults,
  uniqueVehicleTravelSpeedOverrideDefault,
} from "@/app/lib/newVehicleFormDefaults";
import { vehicleSchema } from "@/app/lib/types/vehicle";

describe("official vehicle create", () => {
  it("starts travel speed at 100 km/h and submits 100", () => {
    const defaults = officialVehicleCreateDefaults();
    expect(defaults.travelSpeedKmh).toBe(100);

    const parsed = vehicleSchema.safeParse({
      ...defaults,
      name: "Scout",
      description: "A new official vehicle.",
      brand: undefined,
      costInfo: undefined,
      year: undefined,
      weight: undefined,
      heightMetres: undefined,
      maxCargoWeightKg: undefined,
      maxMountedItems: undefined,
      notes: undefined,
      imageKey: undefined,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.travelSpeedKmh).toBe(100);
    }
  });

  it("keeps the other numeric defaults", () => {
    const defaults = officialVehicleCreateDefaults();
    expect(defaults.combatSpeedMetres).toBe(1);
    expect(defaults.maxHp).toBe(1);
    expect(defaults.manoeuvrability).toBe(0);
    expect(defaults.acceleration).toBe(1);
    expect(defaults.maxPassengers).toBe(1);
    expect(defaults.confCost).toBe(0);
  });
});

describe("custom vehicle create", () => {
  it("starts travel speed at 100 km/h and submits 100", () => {
    const defaults = customVehicleCreateFieldDefaults();
    expect(defaults.travelSpeedKmh).toBe("100");
    expect(Number.parseInt(defaults.travelSpeedKmh, 10)).toBe(100);
  });

  it("keeps the other numeric field defaults", () => {
    const defaults = customVehicleCreateFieldDefaults();
    expect(defaults.combatSpeedMetres).toBe("1");
    expect(defaults.maxHp).toBe("1");
    expect(defaults.manoeuvrability).toBe("0");
    expect(defaults.acceleration).toBe("1");
    expect(defaults.maxPassengers).toBe("1");
    expect(defaults.vehicleSizeCategory).toBe("LIGHT");
    expect(defaults.locomotionModes).toEqual(["LAND"]);
  });
});

describe("unique vehicle create", () => {
  it("starts a standalone vehicle at 100 km/h", () => {
    const defaults = standaloneUniqueVehicleCreateDefaults();
    expect(defaults.travelSpeedKmh).toBe("100");
    expect(Number.parseInt(defaults.travelSpeedKmh, 10)).toBe(100);
  });

  it("shares size, locomotion, passengers, cost, and acceleration with a new official vehicle", () => {
    const defaults = standaloneUniqueVehicleCreateDefaults();
    expect(defaults.maxPassengers).toBe("1");
    expect(defaults.confCost).toBe("0");
    expect(defaults.acceleration).toBe("1");
    expect(defaults.vehicleSizeCategory).toBe("LIGHT");
    expect(defaults.locomotionModes).toEqual(["LAND"]);
  });

  it("starts unique-vehicle manoeuvrability at 1", () => {
    expect(standaloneUniqueVehicleCreateDefaults().manoeuvrability).toBe("1");
  });

  it("leaves the travel-speed override empty when created from a template", () => {
    expect(uniqueVehicleTravelSpeedOverrideDefault("template")).toBe("");
  });
});
