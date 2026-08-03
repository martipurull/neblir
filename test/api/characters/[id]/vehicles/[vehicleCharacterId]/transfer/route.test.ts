import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../../helpers";

const belongsMock = vi.fn();
const getCharacterVehicleRecordMock = vi.fn();
const validateMock = vi.fn();
const performMock = vi.fn();
const activeVehicleFindUniqueMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: (...args: unknown[]) => belongsMock(...args),
}));

vi.mock("@/app/lib/prisma/vehicleCharacter", () => ({
  getCharacterVehicleRecord: (...args: unknown[]) =>
    getCharacterVehicleRecordMock(...args),
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: {
    character: {
      findUnique: (...args: unknown[]) => activeVehicleFindUniqueMock(...args),
    },
  },
}));

vi.mock("@/app/lib/prisma/vehicleTransfer", async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    validateVehicleTransferParties: (...args: unknown[]) =>
      validateMock(...args),
    performVehicleTransfer: (...args: unknown[]) => performMock(...args),
  };
});

describe("POST /api/characters/[id]/vehicles/[vehicleCharacterId]/transfer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateMock.mockResolvedValue(null);
    performMock.mockResolvedValue(undefined);
    activeVehicleFindUniqueMock.mockResolvedValue({
      activeVehicleCharacterId: null,
    });
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/transfer/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest(),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when character does not belong to user", async () => {
    belongsMock.mockResolvedValue(false);
    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/transfer/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ toCharacterId: "char-2" }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 404 when vehicle row is missing", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue(null);
    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/transfer/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ toCharacterId: "char-2" }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 409 when the vehicle is actively ridden", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({
      id: "vc-1",
      sourceType: "GLOBAL_VEHICLE",
      vehicleId: "veh-1",
    });
    activeVehicleFindUniqueMock.mockResolvedValue({
      activeVehicleCharacterId: "vc-1",
    });
    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/transfer/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ toCharacterId: "char-2" }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(409);
    expect(performMock).not.toHaveBeenCalled();
  });

  it("returns validation failure from transfer-party checks", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({
      id: "vc-1",
      sourceType: "GLOBAL_VEHICLE",
      vehicleId: "veh-1",
    });
    validateMock.mockResolvedValue({ message: "nope", status: 403 });
    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/transfer/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ toCharacterId: "char-2" }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(403);
    expect(performMock).not.toHaveBeenCalled();
  });

  it("returns 409 on VehicleTransferConflictError", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({
      id: "vc-1",
      sourceType: "GLOBAL_VEHICLE",
      vehicleId: "veh-1",
    });
    const { VehicleTransferConflictError } =
      await import("@/app/lib/prisma/vehicleTransfer");
    performMock.mockRejectedValue(
      new VehicleTransferConflictError(
        "Vehicle is no longer owned by this character"
      )
    );
    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/transfer/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ toCharacterId: "char-2" }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(409);
  });

  it("returns 200 and performs the transfer", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({
      id: "vc-1",
      sourceType: "CUSTOM_VEHICLE",
      vehicleId: "veh-1",
    });
    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/transfer/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ toCharacterId: "char-2" }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(200);
    expect(performMock).toHaveBeenCalledWith({
      fromCharacterId: "char-1",
      toCharacterId: "char-2",
      vehicleCharacterId: "vc-1",
    });
  });
});
