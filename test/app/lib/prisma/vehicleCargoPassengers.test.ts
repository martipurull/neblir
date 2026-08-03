import { describe, expect, it } from "vitest";
import {
  ITEM_LOCATION_CARRIED,
  formatItemLocationLabel,
  isItemInVehicleCargo,
  parseVehicleCargoItemLocation,
  vehicleCargoItemLocation,
} from "@/app/lib/constants/inventory";
import { getVehicleOccupantCount } from "@/app/lib/prisma/vehiclePassengers";

describe("vehicle cargo location helpers", () => {
  it("builds and parses vehicle cargo locations", () => {
    expect(vehicleCargoItemLocation("vc-1")).toBe("vehicle:vc-1");
    expect(parseVehicleCargoItemLocation("vehicle:vc-1")).toBe("vc-1");
    expect(parseVehicleCargoItemLocation(ITEM_LOCATION_CARRIED)).toBeNull();
    expect(isItemInVehicleCargo({ itemLocation: "vehicle:vc-1" }, "vc-1")).toBe(
      true
    );
    expect(isItemInVehicleCargo({ itemLocation: "vehicle:vc-2" }, "vc-1")).toBe(
      false
    );
    expect(formatItemLocationLabel("vehicle:vc-1")).toBe("Vehicle cargo");
    expect(formatItemLocationLabel("locker")).toBe("locker");
  });
});

describe("vehicle occupant capacity", () => {
  it("counts the driver toward maxPassengers", () => {
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
    ).toEqual({ occupantCount: 1, remainingSeats: 1 });
  });
});
