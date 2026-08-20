import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const characterBelongsToUserMock = vi.fn();
const getCharacterMock = vi.fn();
const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getVehicleMock = vi.fn();
const getCustomVehicleMock = vi.fn();
const createUniqueVehicleMock = vi.fn();
const createVehicleCharacterMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: characterBelongsToUserMock,
}));

vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: getCharacterMock,
}));

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/vehicle", () => ({
  getVehicle: getVehicleMock,
  getCustomVehicle: getCustomVehicleMock,
}));

vi.mock("@/app/lib/prisma/uniqueVehicle", () => ({
  createUniqueVehicle: createUniqueVehicleMock,
  uniqueVehicleCreateDataFromParsed: (
    ownerUserId: string,
    gameId: string,
    parsed: Record<string, unknown>
  ) => ({
    ownerUserId,
    gameId,
    ...parsed,
  }),
}));

vi.mock("@/app/lib/prisma/vehicleCharacter", () => ({
  createVehicleCharacter: createVehicleCharacterMock,
}));

describe("POST /api/characters/[id]/unique-vehicles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      games: [{ game: { id: "g-1", name: "Game" } }],
    });
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    createUniqueVehicleMock.mockResolvedValue({ id: "uv-1" });
    createVehicleCharacterMock.mockResolvedValue({ id: "vc-1" });
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } =
      await import("@/app/api/characters/[id]/unique-vehicles/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when character does not exist", async () => {
    getCharacterMock.mockResolvedValue(null);
    const { POST } =
      await import("@/app/api/characters/[id]/unique-vehicles/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceType: "GLOBAL_VEHICLE", vehicleId: "v-1", gameId: "g-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 403 when requester is neither owner nor GM", async () => {
    characterBelongsToUserMock.mockResolvedValue(false);
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-2" });
    const { POST } =
      await import("@/app/api/characters/[id]/unique-vehicles/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceType: "GLOBAL_VEHICLE", vehicleId: "v-1", gameId: "g-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
    expect(createUniqueVehicleMock).not.toHaveBeenCalled();
  });

  it("returns 400 when character is not linked to supplied game", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      games: [{ game: { id: "g-2", name: "Other" } }],
    });
    const { POST } =
      await import("@/app/api/characters/[id]/unique-vehicles/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceType: "GLOBAL_VEHICLE", vehicleId: "v-1", gameId: "g-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when global template is missing", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    userIsInGameMock.mockResolvedValue(true);
    getVehicleMock.mockResolvedValue(null);
    const { POST } =
      await import("@/app/api/characters/[id]/unique-vehicles/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceType: "GLOBAL_VEHICLE", vehicleId: "missing", gameId: "g-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(404);
    expect(createUniqueVehicleMock).not.toHaveBeenCalled();
  });

  it("returns 400 when custom template belongs to another game", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    userIsInGameMock.mockResolvedValue(true);
    getCustomVehicleMock.mockResolvedValue({
      id: "cv-1",
      gameId: "g-2",
      maxHp: 12,
    });
    const { POST } =
      await import("@/app/api/characters/[id]/unique-vehicles/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceType: "CUSTOM_VEHICLE", vehicleId: "cv-1", gameId: "g-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    expect(createUniqueVehicleMock).not.toHaveBeenCalled();
  });

  it("returns 201 for global vehicle and creates vehicle ownership row", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    userIsInGameMock.mockResolvedValue(true);
    getVehicleMock.mockResolvedValue({ id: "v-1", maxHp: 20 });
    const { POST } =
      await import("@/app/api/characters/[id]/unique-vehicles/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceType: "GLOBAL_VEHICLE", vehicleId: "v-1", gameId: "g-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: "uv-1" });
    expect(createUniqueVehicleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: "user-1",
        gameId: "g-1",
        sourceType: "GLOBAL_VEHICLE",
        vehicleId: "v-1",
      })
    );
    expect(createVehicleCharacterMock).toHaveBeenCalledWith(
      "char-1",
      "UNIQUE_VEHICLE",
      "uv-1",
      { currentHp: 20 }
    );
  });

  it("uses maxHpOverride for initial vehicle HP when provided", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    userIsInGameMock.mockResolvedValue(true);
    getVehicleMock.mockResolvedValue({ id: "v-1", maxHp: 20 });
    const { POST } =
      await import("@/app/api/characters/[id]/unique-vehicles/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          sourceType: "GLOBAL_VEHICLE",
          vehicleId: "v-1",
          gameId: "g-1",
          maxHpOverride: 33,
        },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(201);
    expect(createVehicleCharacterMock).toHaveBeenCalledWith(
      "char-1",
      "UNIQUE_VEHICLE",
      "uv-1",
      { currentHp: 33 }
    );
  });

  it("returns 201 for standalone unique vehicle without template lookup", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    userIsInGameMock.mockResolvedValue(true);
    const { POST } =
      await import("@/app/api/characters/[id]/unique-vehicles/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          sourceType: "STANDALONE",
          gameId: "g-1",
          nameOverride: "Custom Flyer",
          confCostOverride: 5000,
          descriptionOverride: "One-off airframe.",
          maxHpOverride: 18,
          travelSpeedKmhOverride: 200,
          combatSpeedMetresOverride: 30,
          manoeuvrabilityOverride: 4,
          accelerationOverride: 2,
          maxPassengersOverride: 2,
          locomotionModesOverride: ["AIR"],
          vehicleSizeCategoryOverride: "LIGHT",
        },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(201);
    expect(getVehicleMock).not.toHaveBeenCalled();
    expect(getCustomVehicleMock).not.toHaveBeenCalled();
    expect(createUniqueVehicleMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "STANDALONE",
        nameOverride: "Custom Flyer",
        accelerationOverride: 2,
      })
    );
    expect(createVehicleCharacterMock).toHaveBeenCalledWith(
      "char-1",
      "UNIQUE_VEHICLE",
      "uv-1",
      { currentHp: 18 }
    );
  });

  it("returns 403 when custom template disallows member unique creation", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    userIsInGameMock.mockResolvedValue(true);
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    getCustomVehicleMock.mockResolvedValue({
      id: "cv-1",
      gameId: "g-1",
      maxHp: 12,
      membersCanModify: false,
    });
    const { POST } =
      await import("@/app/api/characters/[id]/unique-vehicles/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceType: "CUSTOM_VEHICLE", vehicleId: "cv-1", gameId: "g-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
    expect(createUniqueVehicleMock).not.toHaveBeenCalled();
  });

  it("returns 201 for custom template when membersCanModify is true", async () => {
    characterBelongsToUserMock.mockResolvedValue(true);
    userIsInGameMock.mockResolvedValue(true);
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    getCustomVehicleMock.mockResolvedValue({
      id: "cv-1",
      gameId: "g-1",
      maxHp: 12,
      membersCanModify: true,
    });
    const { POST } =
      await import("@/app/api/characters/[id]/unique-vehicles/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceType: "CUSTOM_VEHICLE", vehicleId: "cv-1", gameId: "g-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(201);
    expect(createUniqueVehicleMock).toHaveBeenCalled();
  });
});
