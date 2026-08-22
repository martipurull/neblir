import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const getGameMock = vi.fn();
const getVehicleMock = vi.fn();
const getCustomVehicleMock = vi.fn();
const createUniqueVehicleMock = vi.fn();
const uniqueVehicleCreateDataFromParsedMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: (...args: unknown[]) => getGameMock(...args),
}));

vi.mock("@/app/lib/prisma/vehicle", () => ({
  getVehicle: (...args: unknown[]) => getVehicleMock(...args),
  getCustomVehicle: (...args: unknown[]) => getCustomVehicleMock(...args),
}));

vi.mock("@/app/lib/prisma/uniqueVehicle", () => ({
  createUniqueVehicle: (...args: unknown[]) => createUniqueVehicleMock(...args),
  uniqueVehicleCreateDataFromParsed: (...args: unknown[]) =>
    uniqueVehicleCreateDataFromParsedMock(...args),
}));

vi.mock("@/app/lib/types/vehicle", async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    uniqueVehicleCreateSchema: { safeParse: safeParseMock },
  };
});

describe("POST /api/unique-vehicles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uniqueVehicleCreateDataFromParsedMock.mockImplementation(
      (
        ownerUserId: string,
        gameId: string,
        parsed: Record<string, unknown>
      ) => ({
        ownerUserId,
        gameId,
        ...parsed,
      })
    );
    createUniqueVehicleMock.mockResolvedValue({ id: "uv-1" });
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/unique-vehicles/route");
    const response = await invokeRoute(POST, makeUnauthedRequest());
    expect(response.status).toBe(401);
  });

  it("returns 400 on invalid payload", async () => {
    safeParseMock.mockReturnValue({
      error: { issues: [{ message: "invalid payload" }] },
      data: undefined,
    });
    const { POST } = await import("@/app/api/unique-vehicles/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ gameId: "g1" }, "user-1")
    );
    expect(response.status).toBe(400);
  });

  it("returns 403 when caller is not the game master", async () => {
    safeParseMock.mockReturnValue({
      data: {
        gameId: "game-1",
        sourceType: "STANDALONE",
        nameOverride: "Rover",
        maxHpOverride: 10,
        travelSpeedKmhOverride: 40,
        combatSpeedMetresOverride: 8,
        manoeuvrabilityOverride: 1,
        accelerationOverride: 1,
        maxPassengersOverride: 1,
        locomotionModesOverride: ["LAND"],
        vehicleSizeCategoryOverride: "STANDARD",
      },
      error: undefined,
    });
    getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "other-gm" });
    const { POST } = await import("@/app/api/unique-vehicles/route");
    const response = await invokeRoute(POST, makeAuthedRequest({}, "user-1"));
    expect(response.status).toBe(403);
  });

  it("creates a unique vehicle for the game master", async () => {
    const payload = {
      gameId: "game-1",
      sourceType: "STANDALONE",
      nameOverride: "Rover",
      maxHpOverride: 10,
      travelSpeedKmhOverride: 40,
      combatSpeedMetresOverride: 8,
      manoeuvrabilityOverride: 1,
      accelerationOverride: 1,
      maxPassengersOverride: 1,
      locomotionModesOverride: ["LAND"],
      vehicleSizeCategoryOverride: "STANDARD",
    };
    safeParseMock.mockReturnValue({ data: payload, error: undefined });
    getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "user-1" });
    const { POST } = await import("@/app/api/unique-vehicles/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(payload, "user-1")
    );
    expect(response.status).toBe(201);
    expect(createUniqueVehicleMock).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ id: "uv-1" });
  });
});
