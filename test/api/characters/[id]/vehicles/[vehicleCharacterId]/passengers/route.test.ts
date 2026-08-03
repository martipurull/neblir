import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../../helpers";

const belongsMock = vi.fn();
const getCharacterVehicleRecordMock = vi.fn();
const resolveVehicleMock = vi.fn();
const getHydratedVehicleCharacterMock = vi.fn();
const addPassengerToVehicleMock = vi.fn();
const removePassengerFromVehicleMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: (...args: unknown[]) => belongsMock(...args),
}));

vi.mock("@/app/lib/prisma/vehicleCharacter", () => ({
  getCharacterVehicleRecord: (...args: unknown[]) =>
    getCharacterVehicleRecordMock(...args),
  resolveVehicle: (...args: unknown[]) => resolveVehicleMock(...args),
  getHydratedVehicleCharacter: (...args: unknown[]) =>
    getHydratedVehicleCharacterMock(...args),
}));

vi.mock("@/app/lib/prisma/vehiclePassengers", () => ({
  addPassengerToVehicle: (...args: unknown[]) =>
    addPassengerToVehicleMock(...args),
  removePassengerFromVehicle: (...args: unknown[]) =>
    removePassengerFromVehicleMock(...args),
  VehiclePassengerConflictError: class VehiclePassengerConflictError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "VehiclePassengerConflictError";
    }
  },
}));

describe("POST /api/characters/[id]/vehicles/[vehicleCharacterId]/passengers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/passengers/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({ passengerCharacterId: "char-2" }),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(401);
  });

  it("adds a passenger when capacity allows", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({
      id: "vc-1",
      sourceType: "GLOBAL_VEHICLE",
      vehicleId: "veh-1",
    });
    resolveVehicleMock.mockResolvedValue({ maxPassengers: 2 });
    addPassengerToVehicleMock.mockResolvedValue(undefined);
    getHydratedVehicleCharacterMock.mockResolvedValue({
      id: "vc-1",
      passengers: [{ characterId: "char-2", name: "Ada" }],
    });

    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/passengers/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ passengerCharacterId: "char-2" }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(201);
    expect(addPassengerToVehicleMock).toHaveBeenCalledWith({
      ownerCharacterId: "char-1",
      vehicleCharacterId: "vc-1",
      passengerCharacterId: "char-2",
      maxPassengers: 2,
    });
  });

  it("returns 409 on passenger conflicts", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({
      id: "vc-1",
      sourceType: "GLOBAL_VEHICLE",
      vehicleId: "veh-1",
    });
    resolveVehicleMock.mockResolvedValue({ maxPassengers: 1 });
    const { VehiclePassengerConflictError } =
      await import("@/app/lib/prisma/vehiclePassengers");
    addPassengerToVehicleMock.mockRejectedValue(
      new VehiclePassengerConflictError(
        "This vehicle is at passenger capacity (1 including the driver)"
      )
    );

    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/passengers/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ passengerCharacterId: "char-2" }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(409);
  });
});

describe("DELETE /api/characters/[id]/vehicles/[vehicleCharacterId]/passengers/[passengerCharacterId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes a passenger from an owned vehicle", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({ id: "vc-1" });
    removePassengerFromVehicleMock.mockResolvedValue(undefined);
    getHydratedVehicleCharacterMock.mockResolvedValue({
      id: "vc-1",
      passengers: [],
    });

    const { DELETE } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/passengers/[passengerCharacterId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({
        id: "char-1",
        vehicleCharacterId: "vc-1",
        passengerCharacterId: "char-2",
      })
    );
    expect(response.status).toBe(200);
    expect(removePassengerFromVehicleMock).toHaveBeenCalledWith({
      ownerCharacterId: "char-1",
      vehicleCharacterId: "vc-1",
      passengerCharacterId: "char-2",
    });
  });
});
