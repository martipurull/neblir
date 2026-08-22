import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameMock = vi.fn();
const characterIsInGameMock = vi.fn();
const getVehicleMock = vi.fn();
const getCustomVehicleMock = vi.fn();
const getUniqueVehicleMock = vi.fn();
const createVehicleCharacterMock = vi.fn();
const getHydratedVehicleCharacterMock = vi.fn();
const getInitialCurrentHpForVehicleMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: (...args: unknown[]) => getGameMock(...args),
}));

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  characterIsInGame: (...args: unknown[]) => characterIsInGameMock(...args),
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
    createVehicleCharacter: (...args: unknown[]) =>
      createVehicleCharacterMock(...args),
    getHydratedVehicleCharacter: (...args: unknown[]) =>
      getHydratedVehicleCharacterMock(...args),
    getInitialCurrentHpForVehicle: (...args: unknown[]) =>
      getInitialCurrentHpForVehicleMock(...args),
  };
});

describe("POST /api/games/[id]/give-vehicle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getInitialCurrentHpForVehicleMock.mockResolvedValue(18);
    getHydratedVehicleCharacterMock.mockResolvedValue({ id: "vc-1" });
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/games/[id]/give-vehicle/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({
        characterId: "char-1",
        sourceType: "GLOBAL_VEHICLE",
        vehicleId: "veh-1",
      }),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when game does not exist", async () => {
    getGameMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/games/[id]/give-vehicle/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          characterId: "char-1",
          sourceType: "GLOBAL_VEHICLE",
          vehicleId: "veh-1",
        },
        "user-1"
      ),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 403 when requester is not the game master", async () => {
    getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "other-user" });
    const { POST } = await import("@/app/api/games/[id]/give-vehicle/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          characterId: "char-1",
          sourceType: "GLOBAL_VEHICLE",
          vehicleId: "veh-1",
        },
        "user-1"
      ),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 400 on invalid body", async () => {
    getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "user-1" });
    const { POST } = await import("@/app/api/games/[id]/give-vehicle/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "", sourceType: "GLOBAL_VEHICLE" },
        "user-1"
      ),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 403 when character is not in the game", async () => {
    getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "user-1" });
    characterIsInGameMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/games/[id]/give-vehicle/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          characterId: "char-1",
          sourceType: "GLOBAL_VEHICLE",
          vehicleId: "veh-1",
        },
        "user-1"
      ),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 403 when custom vehicle belongs to another game", async () => {
    getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "user-1" });
    characterIsInGameMock.mockResolvedValue(true);
    getCustomVehicleMock.mockResolvedValue({
      id: "cv-1",
      gameId: "other-game",
    });
    const { POST } = await import("@/app/api/games/[id]/give-vehicle/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          characterId: "char-1",
          sourceType: "CUSTOM_VEHICLE",
          vehicleId: "cv-1",
        },
        "user-1"
      ),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 403 when unique vehicle belongs to a different game", async () => {
    getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "user-1" });
    characterIsInGameMock.mockResolvedValue(true);
    getUniqueVehicleMock.mockResolvedValue({
      id: "uv-1",
      ownerUserId: "other-user",
      gameId: "other-game",
    });
    const { POST } = await import("@/app/api/games/[id]/give-vehicle/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          characterId: "char-1",
          sourceType: "UNIQUE_VEHICLE",
          vehicleId: "uv-1",
        },
        "user-1"
      ),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 409 when a unique vehicle is already assigned", async () => {
    getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "user-1" });
    characterIsInGameMock.mockResolvedValue(true);
    getUniqueVehicleMock.mockResolvedValue({
      id: "uv-1",
      ownerUserId: "user-1",
      gameId: "game-1",
    });
    const { VehicleCharacterConflictError } =
      await import("@/app/lib/prisma/vehicleCharacter");
    createVehicleCharacterMock.mockRejectedValue(
      new VehicleCharacterConflictError(
        "This unique vehicle is already owned by a character."
      )
    );
    const { POST } = await import("@/app/api/games/[id]/give-vehicle/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          characterId: "char-1",
          sourceType: "UNIQUE_VEHICLE",
          vehicleId: "uv-1",
        },
        "user-1"
      ),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(409);
  });

  it("returns 201 and gives a global vehicle", async () => {
    getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "user-1" });
    characterIsInGameMock.mockResolvedValue(true);
    getVehicleMock.mockResolvedValue({ id: "veh-1", maxHp: 18 });
    createVehicleCharacterMock.mockResolvedValue({ id: "vc-1" });
    const { POST } = await import("@/app/api/games/[id]/give-vehicle/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          characterId: "char-1",
          sourceType: "GLOBAL_VEHICLE",
          vehicleId: "veh-1",
        },
        "user-1"
      ),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(201);
    expect(createVehicleCharacterMock).toHaveBeenCalledWith(
      "char-1",
      "GLOBAL_VEHICLE",
      "veh-1",
      { currentHp: 18 }
    );
  });
});
