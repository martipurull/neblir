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
const stowItemAsVehicleCargoMock = vi.fn();
const retrieveItemFromVehicleCargoMock = vi.fn();
const itemCharacterFindFirstMock = vi.fn();

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

vi.mock("@/app/lib/prisma/vehicleCargo", () => ({
  stowItemAsVehicleCargo: (...args: unknown[]) =>
    stowItemAsVehicleCargoMock(...args),
  retrieveItemFromVehicleCargo: (...args: unknown[]) =>
    retrieveItemFromVehicleCargoMock(...args),
  VehicleCargoConflictError: class VehicleCargoConflictError extends Error {
    status: 404 | 409;
    constructor(message: string, status: 404 | 409 = 409) {
      super(message);
      this.name = "VehicleCargoConflictError";
      this.status = status;
    }
  },
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    itemCharacter: {
      findFirst: (...args: unknown[]) => itemCharacterFindFirstMock(...args),
    },
  },
}));

vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: vi.fn(),
  updateCharacter: vi.fn(),
}));

vi.mock("@/app/lib/equipCombatUtils", () => ({
  computeCombatInfoUpdateForCharacter: () => ({}),
}));

describe("POST /api/characters/[id]/vehicles/[vehicleCharacterId]/cargo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/cargo/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({ itemCharacterId: "ic-1" }),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when vehicle is missing", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue(null);
    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/cargo/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ itemCharacterId: "ic-1" }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(404);
  });

  it("stows cargo for an owned vehicle", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({
      id: "vc-1",
      sourceType: "GLOBAL_VEHICLE",
      vehicleId: "veh-1",
    });
    resolveVehicleMock.mockResolvedValue({ maxCargoWeightKg: 50 });
    itemCharacterFindFirstMock.mockResolvedValue({
      isEquipped: false,
      equipSlots: [],
    });
    stowItemAsVehicleCargoMock.mockResolvedValue({ itemCharacterId: "ic-1" });
    getHydratedVehicleCharacterMock.mockResolvedValue({
      id: "vc-1",
      cargoItems: [{ itemCharacterId: "ic-1" }],
    });

    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/cargo/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ itemCharacterId: "ic-1" }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(201);
    expect(stowItemAsVehicleCargoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerCharacterId: "char-1",
        vehicleCharacterId: "vc-1",
        itemCharacterId: "ic-1",
        maxCargoWeightKg: 50,
      })
    );
  });

  it("returns 409 on cargo conflicts", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({
      id: "vc-1",
      sourceType: "GLOBAL_VEHICLE",
      vehicleId: "veh-1",
    });
    resolveVehicleMock.mockResolvedValue({ maxCargoWeightKg: 1 });
    itemCharacterFindFirstMock.mockResolvedValue({
      isEquipped: false,
      equipSlots: [],
    });
    const { VehicleCargoConflictError } =
      await import("@/app/lib/prisma/vehicleCargo");
    stowItemAsVehicleCargoMock.mockRejectedValue(
      new VehicleCargoConflictError("Cargo would exceed max cargo weight")
    );

    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/cargo/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ itemCharacterId: "ic-1" }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(409);
  });
});

describe("DELETE /api/characters/[id]/vehicles/[vehicleCharacterId]/cargo/[itemCharacterId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves cargo for an owned vehicle", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({ id: "vc-1" });
    retrieveItemFromVehicleCargoMock.mockResolvedValue(undefined);
    getHydratedVehicleCharacterMock.mockResolvedValue({
      id: "vc-1",
      cargoItems: [],
    });

    const { DELETE } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/cargo/[itemCharacterId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({
        id: "char-1",
        vehicleCharacterId: "vc-1",
        itemCharacterId: "ic-1",
      })
    );
    expect(response.status).toBe(200);
    expect(retrieveItemFromVehicleCargoMock).toHaveBeenCalledWith({
      ownerCharacterId: "char-1",
      vehicleCharacterId: "vc-1",
      itemCharacterId: "ic-1",
    });
  });

  it("returns 401 when unauthenticated", async () => {
    const { DELETE } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/cargo/[itemCharacterId]/route");
    const response = await invokeRoute(
      DELETE,
      makeUnauthedRequest(),
      makeParams({
        id: "char-1",
        vehicleCharacterId: "vc-1",
        itemCharacterId: "ic-1",
      })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when character is not owned", async () => {
    belongsMock.mockResolvedValue(false);
    const { DELETE } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/cargo/[itemCharacterId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({
        id: "char-1",
        vehicleCharacterId: "vc-1",
        itemCharacterId: "ic-1",
      })
    );
    expect(response.status).toBe(403);
  });

  it("returns 404 when the vehicle is missing", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue(null);
    const { DELETE } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/cargo/[itemCharacterId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({
        id: "char-1",
        vehicleCharacterId: "vc-1",
        itemCharacterId: "ic-1",
      })
    );
    expect(response.status).toBe(404);
  });

  it("returns 404 when cargo is not on the vehicle", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({ id: "vc-1" });
    const { VehicleCargoConflictError } =
      await import("@/app/lib/prisma/vehicleCargo");
    retrieveItemFromVehicleCargoMock.mockRejectedValue(
      new VehicleCargoConflictError("Cargo item not found on this vehicle", 404)
    );
    const { DELETE } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/cargo/[itemCharacterId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({
        id: "char-1",
        vehicleCharacterId: "vc-1",
        itemCharacterId: "ic-1",
      })
    );
    expect(response.status).toBe(404);
  });
});
