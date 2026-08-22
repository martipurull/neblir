import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getCustomVehiclesByGameMock = vi.fn();
const createCustomVehicleMock = vi.fn();
const safeParseMock = vi.fn();
const omitMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/vehicle", () => ({
  getCustomVehiclesByGame: getCustomVehiclesByGameMock,
  createCustomVehicle: createCustomVehicleMock,
}));

vi.mock("@/app/lib/types/vehicle", () => ({
  customVehicleCreateSchema: {
    omit: omitMock,
  },
}));

describe("/api/games/[id]/custom-vehicles route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    omitMock.mockReturnValue({ safeParse: safeParseMock });
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/games/[id]/custom-vehicles/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
  });

  it("GET returns 403 when user has no game access", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-2" });
    userIsInGameMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/games/[id]/custom-vehicles/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
  });

  it("GET returns 200 for game members", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-2" });
    userIsInGameMock.mockResolvedValue(true);
    getCustomVehiclesByGameMock.mockResolvedValue([{ id: "cv-1" }]);
    const { GET } = await import("@/app/api/games/[id]/custom-vehicles/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ id: "cv-1" }]);
  });

  it("POST returns 400 on invalid body", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    safeParseMock.mockReturnValue({
      error: { issues: [{ message: "invalid custom vehicle" }] },
      data: undefined,
    });
    const { POST } = await import("@/app/api/games/[id]/custom-vehicles/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ bad: true }, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
  });

  it("POST returns 403 when authenticated user is not the game master", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/games/[id]/custom-vehicles/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ name: "Speeder", maxHp: 10 }, "player-1"),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(403);
    expect(createCustomVehicleMock).not.toHaveBeenCalled();
    expect(safeParseMock).not.toHaveBeenCalled();
  });

  it("POST returns 201 on success", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    safeParseMock.mockReturnValue({
      data: { name: "Speeder", maxHp: 10 },
      error: undefined,
    });
    createCustomVehicleMock.mockResolvedValue({ id: "cv-1" });
    const { POST } = await import("@/app/api/games/[id]/custom-vehicles/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ name: "Speeder", maxHp: 10 }, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(201);
    expect(createCustomVehicleMock).toHaveBeenCalledWith({
      name: "Speeder",
      maxHp: 10,
      gameId: "g-1",
    });
  });
});
