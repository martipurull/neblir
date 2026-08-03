import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../../helpers";

const belongsMock = vi.fn();
const getCharacterVehicleRecordMock = vi.fn();
const listMountedItemsForVehicleMock = vi.fn();
const attachItemToVehicleMock = vi.fn();
const getHydratedVehicleCharacterMock = vi.fn();
const itemCharacterFindFirstMock = vi.fn();
const getCharacterMock = vi.fn();
const updateCharacterMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: (...args: unknown[]) => belongsMock(...args),
}));

vi.mock("@/app/lib/prisma/vehicleCharacter", () => ({
  getCharacterVehicleRecord: (...args: unknown[]) =>
    getCharacterVehicleRecordMock(...args),
  getHydratedVehicleCharacter: (...args: unknown[]) =>
    getHydratedVehicleCharacterMock(...args),
  resolveVehicle: vi.fn().mockResolvedValue({ maxMountedItems: null }),
}));

vi.mock("@/app/lib/prisma/vehicleMountedItem", () => ({
  listMountedItemsForVehicle: (...args: unknown[]) =>
    listMountedItemsForVehicleMock(...args),
  attachItemToVehicle: (...args: unknown[]) => attachItemToVehicleMock(...args),
  VehicleMountedItemConflictError: class VehicleMountedItemConflictError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "VehicleMountedItemConflictError";
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
  getCharacter: (...args: unknown[]) => getCharacterMock(...args),
  updateCharacter: (...args: unknown[]) => updateCharacterMock(...args),
}));

vi.mock("@/app/lib/equipCombatUtils", () => ({
  computeCombatInfoUpdateForCharacter: () => ({ armourMod: 0 }),
}));

describe("/api/characters/[id]/vehicles/[vehicleCharacterId]/mounted-items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/mounted-items/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(401);
  });

  it("GET returns mounted items for an owned vehicle", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({ id: "vc-1" });
    listMountedItemsForVehicleMock.mockResolvedValue([
      { id: "mount-1", itemCharacterId: "ic-1" },
    ]);
    const { GET } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/mounted-items/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { id: "mount-1", itemCharacterId: "ic-1" },
    ]);
  });

  it("POST returns 404 when vehicle is missing", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue(null);
    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/mounted-items/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ itemCharacterId: "ic-1" }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(404);
  });

  it("POST mounts an item and returns hydrated vehicle", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({
      id: "vc-1",
      sourceType: "GLOBAL_VEHICLE",
      vehicleId: "veh-1",
    });
    itemCharacterFindFirstMock.mockResolvedValue({
      isEquipped: false,
      equipSlots: [],
    });
    attachItemToVehicleMock.mockResolvedValue({
      id: "mount-1",
      itemCharacterId: "ic-1",
    });
    getHydratedVehicleCharacterMock.mockResolvedValue({
      id: "vc-1",
      mountedItems: [{ id: "mount-1", itemCharacterId: "ic-1" }],
    });
    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/mounted-items/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ itemCharacterId: "ic-1" }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      mountedItem: { id: "mount-1" },
      vehicle: { id: "vc-1" },
    });
    expect(updateCharacterMock).not.toHaveBeenCalled();
  });

  it("POST syncs combat when mounting an equipped item", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehicleRecordMock.mockResolvedValue({
      id: "vc-1",
      sourceType: "GLOBAL_VEHICLE",
      vehicleId: "veh-1",
    });
    itemCharacterFindFirstMock.mockResolvedValue({
      isEquipped: true,
      equipSlots: ["HAND"],
    });
    attachItemToVehicleMock.mockResolvedValue({
      id: "mount-1",
      itemCharacterId: "ic-1",
    });
    getHydratedVehicleCharacterMock.mockResolvedValue({ id: "vc-1" });
    getCharacterMock.mockResolvedValue({
      combatInformation: { armourMod: 1 },
    });
    const { POST } =
      await import("@/app/api/characters/[id]/vehicles/[vehicleCharacterId]/mounted-items/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ itemCharacterId: "ic-1" }, "user-1"),
      makeParams({ id: "char-1", vehicleCharacterId: "vc-1" })
    );
    expect(response.status).toBe(201);
    expect(updateCharacterMock).toHaveBeenCalled();
  });
});
