import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../../../helpers";

const belongsMock = vi.fn();
const getCharacterVehicleRecordMock = vi.fn();
const getHydratedVehicleCharacterMock = vi.fn();
const detachItemFromVehicleMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: (...args: unknown[]) => belongsMock(...args),
}));

vi.mock("@/app/lib/prisma/vehicleCharacter", () => ({
  getCharacterVehicleRecord: (...args: unknown[]) =>
    getCharacterVehicleRecordMock(...args),
  getHydratedVehicleCharacter: (...args: unknown[]) =>
    getHydratedVehicleCharacterMock(...args),
}));

vi.mock("@/app/lib/prisma/vehicleMountedItem", () => ({
  detachItemFromVehicle: (...args: unknown[]) =>
    detachItemFromVehicleMock(...args),
  VehicleMountedItemConflictError: class VehicleMountedItemConflictError extends Error {
    status: 404 | 409;
    constructor(message: string, status: 404 | 409 = 409) {
      super(message);
      this.name = "VehicleMountedItemConflictError";
      this.status = status;
    }
  },
}));

describe("DELETE /api/characters/[id]/vehicles/[vehicleCharacterId]/mounted-items/[mountedItemId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { DELETE } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/mounted-items/[mountedItemId]/route");
    const response = await invokeRoute(
      DELETE,
      makeUnauthedRequest(),
      makeParams({
        id: "char-1",
        vehicleCharacterId: "vc-1",
        mountedItemId: "mount-1",
      })
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when vehicle is missing", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue(null);
    const { DELETE } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/mounted-items/[mountedItemId]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({
        id: "char-1",
        vehicleCharacterId: "vc-1",
        mountedItemId: "mount-1",
      })
    );
    expect(response.status).toBe(404);
  });

  it("detaches a mounted item", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({ id: "vc-1" });
    detachItemFromVehicleMock.mockResolvedValue(undefined);
    getHydratedVehicleCharacterMock.mockResolvedValue({
      id: "vc-1",
      mountedItems: [],
    });
    const { DELETE } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/mounted-items/[mountedItemId]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({
        id: "char-1",
        vehicleCharacterId: "vc-1",
        mountedItemId: "mount-1",
      })
    );
    expect(response.status).toBe(200);
    expect(detachItemFromVehicleMock).toHaveBeenCalledWith({
      characterId: "char-1",
      vehicleCharacterId: "vc-1",
      mountedItemId: "mount-1",
    });
  });

  it("returns 404 when mounted item is missing", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({ id: "vc-1" });
    const { VehicleMountedItemConflictError } =
      await import("@/app/lib/prisma/vehicleMountedItem");
    detachItemFromVehicleMock.mockRejectedValue(
      new VehicleMountedItemConflictError("Mounted item not found", 404)
    );
    const { DELETE } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/mounted-items/[mountedItemId]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({
        id: "char-1",
        vehicleCharacterId: "vc-1",
        mountedItemId: "missing",
      })
    );
    expect(response.status).toBe(404);
  });
});
