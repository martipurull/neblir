import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const belongsMock = vi.fn();
const inGameMock = vi.fn();
const getCharacterVehiclesMock = vi.fn();
const createVehicleCharacterMock = vi.fn();
const getHydratedVehicleCharacterMock = vi.fn();
const getInitialCurrentHpForVehicleMock = vi.fn();
const getVehicleMock = vi.fn();
const getCustomVehicleMock = vi.fn();
const getUniqueVehicleMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: (...args: unknown[]) => belongsMock(...args),
}));

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  characterIsInGame: (...args: unknown[]) => inGameMock(...args),
}));

vi.mock("@/app/lib/prisma/vehicle", () => ({
  getVehicle: (...args: unknown[]) => getVehicleMock(...args),
  getCustomVehicle: (...args: unknown[]) => getCustomVehicleMock(...args),
}));

vi.mock("@/app/lib/prisma/uniqueVehicle", () => ({
  getUniqueVehicle: (...args: unknown[]) => getUniqueVehicleMock(...args),
}));

vi.mock("@/app/lib/prisma/vehicleCharacter", async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    getCharacterVehicles: (...args: unknown[]) =>
      getCharacterVehiclesMock(...args),
    createVehicleCharacter: (...args: unknown[]) =>
      createVehicleCharacterMock(...args),
    getHydratedVehicleCharacter: (...args: unknown[]) =>
      getHydratedVehicleCharacterMock(...args),
    getInitialCurrentHpForVehicle: (...args: unknown[]) =>
      getInitialCurrentHpForVehicleMock(...args),
  };
});

describe("/api/characters/[id]/vehicles handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getInitialCurrentHpForVehicleMock.mockResolvedValue(20);
    getHydratedVehicleCharacterMock.mockResolvedValue({ id: "vc-1" });
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/characters/[id]/vehicles/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(401);
  });

  it("GET returns 403 when character is not owned", async () => {
    belongsMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/characters/[id]/vehicles/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
  });

  it("GET returns 200 with vehicles on success", async () => {
    belongsMock.mockResolvedValue(true);
    getCharacterVehiclesMock.mockResolvedValue([{ id: "vc-1" }]);
    const { GET } = await import("@/app/api/characters/[id]/vehicles/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ id: "vc-1" }]);
  });

  it("POST returns 400 on invalid body", async () => {
    belongsMock.mockResolvedValue(true);
    const { POST } = await import("@/app/api/characters/[id]/vehicles/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ bad: true }, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
  });

  it("POST returns 404 when global vehicle is missing", async () => {
    belongsMock.mockResolvedValue(true);
    getVehicleMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/characters/[id]/vehicles/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceType: "GLOBAL_VEHICLE", vehicleId: "veh-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(404);
    expect(createVehicleCharacterMock).not.toHaveBeenCalled();
  });

  it("POST returns 403 when custom vehicle is outside the character game", async () => {
    belongsMock.mockResolvedValue(true);
    getCustomVehicleMock.mockResolvedValue({ id: "cv-1", gameId: "game-1" });
    inGameMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/characters/[id]/vehicles/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceType: "CUSTOM_VEHICLE", vehicleId: "cv-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
    expect(createVehicleCharacterMock).not.toHaveBeenCalled();
  });

  it("POST returns 403 when unique vehicle is not owned by requester", async () => {
    belongsMock.mockResolvedValue(true);
    getUniqueVehicleMock.mockResolvedValue({
      id: "uv-1",
      ownerUserId: "other-user",
      gameId: "game-1",
    });
    const { POST } = await import("@/app/api/characters/[id]/vehicles/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceType: "UNIQUE_VEHICLE", vehicleId: "uv-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
    expect(createVehicleCharacterMock).not.toHaveBeenCalled();
  });

  it("POST returns 409 when unique vehicle is already assigned", async () => {
    belongsMock.mockResolvedValue(true);
    getUniqueVehicleMock.mockResolvedValue({
      id: "uv-1",
      ownerUserId: "user-1",
      gameId: "game-1",
    });
    inGameMock.mockResolvedValue(true);
    const { VehicleCharacterConflictError } =
      await import("@/app/lib/prisma/vehicleCharacter");
    createVehicleCharacterMock.mockRejectedValue(
      new VehicleCharacterConflictError(
        "This unique vehicle is already owned by a character."
      )
    );
    const { POST } = await import("@/app/api/characters/[id]/vehicles/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceType: "UNIQUE_VEHICLE", vehicleId: "uv-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(409);
  });

  it("POST returns 201 and creates a discrete vehicle row", async () => {
    belongsMock.mockResolvedValue(true);
    getVehicleMock.mockResolvedValue({ id: "veh-1", maxHp: 20 });
    createVehicleCharacterMock.mockResolvedValue({ id: "vc-1" });
    const { POST } = await import("@/app/api/characters/[id]/vehicles/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceType: "GLOBAL_VEHICLE", vehicleId: "veh-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(201);
    expect(getInitialCurrentHpForVehicleMock).toHaveBeenCalledWith(
      "GLOBAL_VEHICLE",
      "veh-1"
    );
    expect(createVehicleCharacterMock).toHaveBeenCalledWith(
      "char-1",
      "GLOBAL_VEHICLE",
      "veh-1",
      { currentHp: 20 }
    );
  });
});
