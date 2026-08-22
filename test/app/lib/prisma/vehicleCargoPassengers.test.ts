import { describe, expect, it } from "vitest";
import {
  ITEM_LOCATION_CARRIED,
  formatItemLocationLabel,
  isItemInVehicleCargo,
  parseVehicleCargoItemLocation,
  parseVehicleMountedItemLocation,
  vehicleCargoItemLocation,
  vehicleMountedItemLocation,
} from "@/app/lib/constants/inventory";
import { getVehicleOccupantCount } from "@/app/lib/prisma/vehiclePassengers";

describe("vehicle cargo location helpers", () => {
  it("builds and parses vehicle cargo locations", () => {
    expect(vehicleCargoItemLocation("vc-1")).toBe("vehicle:vc-1");
    expect(parseVehicleCargoItemLocation("vehicle:vc-1")).toBe("vc-1");
    expect(parseVehicleCargoItemLocation(ITEM_LOCATION_CARRIED)).toBeNull();
    expect(parseVehicleCargoItemLocation("vehicle-mounted:vc-1")).toBeNull();
    expect(isItemInVehicleCargo({ itemLocation: "vehicle:vc-1" }, "vc-1")).toBe(
      true
    );
    expect(isItemInVehicleCargo({ itemLocation: "vehicle:vc-2" }, "vc-1")).toBe(
      false
    );
    expect(formatItemLocationLabel("vehicle:vc-1")).toBe("Vehicle cargo");
    expect(
      formatItemLocationLabel("vehicle:vc-1", {
        vehicleNamesById: { "vc-1": "Speeder" },
      })
    ).toBe("Speeder");
    expect(formatItemLocationLabel("locker")).toBe("locker");
  });

  it("builds and formats vehicle mounted locations", () => {
    expect(vehicleMountedItemLocation("vc-1")).toBe("vehicle-mounted:vc-1");
    expect(parseVehicleMountedItemLocation("vehicle-mounted:vc-1")).toBe(
      "vc-1"
    );
    expect(parseVehicleMountedItemLocation("vehicle:vc-1")).toBeNull();
    expect(formatItemLocationLabel("vehicle-mounted:vc-1")).toBe(
      "Vehicle (mounted)"
    );
    expect(
      formatItemLocationLabel("vehicle-mounted:vc-1", {
        vehicleNamesById: { "vc-1": "Speeder" },
      })
    ).toBe("Speeder (mounted)");
  });
});

describe("vehicle occupant capacity", () => {
  it("always reserves the driver seat in remaining capacity", () => {
    expect(
      getVehicleOccupantCount({
        maxPassengers: 2,
        driverPresent: true,
        passengerCharacterIds: ["char-2"],
      })
    ).toEqual({ occupantCount: 2, remainingSeats: 0 });

    expect(
      getVehicleOccupantCount({
        maxPassengers: 2,
        driverPresent: false,
        passengerCharacterIds: ["char-2"],
      })
    ).toEqual({ occupantCount: 1, remainingSeats: 0 });

    expect(
      getVehicleOccupantCount({
        maxPassengers: 2,
        driverPresent: false,
        passengerCharacterIds: [],
      })
    ).toEqual({ occupantCount: 0, remainingSeats: 1 });
  });
});
