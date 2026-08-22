import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const belongsMock = vi.fn();
const getCharacterVehicleRecordMock = vi.fn();
const updateVehicleCharacterMock = vi.fn();
const getHydratedVehicleCharacterMock = vi.fn();
const clearVehicleRidersMock = vi.fn();
const deleteVehicleCharacterMock = vi.fn();
const canVehicleBeRiddenMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: (...args: unknown[]) => belongsMock(...args),
}));

vi.mock("@/app/lib/prisma/vehicleCharacter", () => ({
  getCharacterVehicleRecord: (...args: unknown[]) =>
    getCharacterVehicleRecordMock(...args),
  updateVehicleCharacter: (...args: unknown[]) =>
    updateVehicleCharacterMock(...args),
  getHydratedVehicleCharacter: (...args: unknown[]) =>
    getHydratedVehicleCharacterMock(...args),
  clearVehicleRiders: (...args: unknown[]) => clearVehicleRidersMock(...args),
  deleteVehicleCharacter: (...args: unknown[]) =>
    deleteVehicleCharacterMock(...args),
  canVehicleBeRidden: (...args: unknown[]) => canVehicleBeRiddenMock(...args),
}));

describe("/api/characters/[id]/vehicles/[vehicleCharacterId] handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("PATCH returns 401 when unauthenticated", async () => {
    const { PATCH } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/route");
    const response = await invokeRoute(
      PATCH,
      makeUnauthedRequest(),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(401);
  });

  it("PATCH returns 404 when vehicle is missing", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue(null);
    const { PATCH } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setHp", currentHp: 5 }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(404);
  });

  it("PATCH adjusts HP and clears active vehicle when it becomes non-ridable", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock
      .mockResolvedValueOnce({
        id: "vc-1",
        characterId: "char-1",
        currentHp: 10,
      })
      .mockResolvedValueOnce({
        id: "vc-1",
        characterId: "char-1",
        currentHp: -2,
        isBeyondRepair: false,
      });
    canVehicleBeRiddenMock.mockReturnValue(false);
    getHydratedVehicleCharacterMock.mockResolvedValue({
      id: "vc-1",
      derivedStatus: "BROKEN_DOWN",
    });
    const { PATCH } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "adjustHp", amount: -12 }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(200);
    expect(updateVehicleCharacterMock).toHaveBeenCalledWith("vc-1", {
      currentHp: -2,
    });
    expect(clearVehicleRidersMock).toHaveBeenCalledWith("vc-1");
  });

  it("PATCH returns 400 on invalid body", async () => {
    belongsMock.mockResolvedValue(true);
    const { PATCH } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setParkedAt", parkedAt: "" }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(400);
  });

  it("DELETE returns 404 when vehicle is missing", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue(null);
    const { DELETE } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(404);
  });

  it("DELETE clears active vehicle and deletes the row", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({
      id: "vc-1",
      characterId: "char-1",
    });
    deleteVehicleCharacterMock.mockResolvedValue(undefined);
    const { DELETE } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(204);
    expect(clearVehicleRidersMock).toHaveBeenCalledWith("vc-1");
    expect(deleteVehicleCharacterMock).toHaveBeenCalledWith("vc-1");
  });
});
