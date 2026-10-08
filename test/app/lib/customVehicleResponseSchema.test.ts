import { describe, expect, it } from "vitest";
import { customVehicleListResponseSchema } from "@/app/lib/types/vehicle";

const storedRow = {
  id: "veh-1",
  gameId: "game-1",
  name: "Mule",
  year: null,
  imageKey: null,
  confCost: null,
  costInfo: null,
  description: null,
  notes: null,
  maxHp: 20,
  travelSpeedKmh: 60,
  combatSpeedMetres: 10,
  manoeuvrability: 2,
  acceleration: 3,
  weight: null,
  heightMetres: null,
  maxCargoWeightKg: null,
  maxMountedItems: null,
  maxPassengers: 2,
  locomotionModes: ["LAND"],
  vehicleSizeCategory: "STANDARD",
  membersCanModify: false,
};

describe("customVehicleListResponseSchema", () => {
  it("accepts a stored custom vehicle with no brand", () => {
    const parsed = customVehicleListResponseSchema.safeParse([
      { ...storedRow, brand: null },
    ]);

    expect(parsed.success).toBe(true);
  });

  it("keeps a stored brand", () => {
    const parsed = customVehicleListResponseSchema.parse([
      { ...storedRow, brand: "Hexa" },
    ]);

    expect(parsed[0]?.brand).toBe("Hexa");
  });
});
