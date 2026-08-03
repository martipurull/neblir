import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";

const getResolvedUniqueVehicleMock = vi.fn();
const getUniqueVehicleMock = vi.fn();
const updateUniqueVehicleMock = vi.fn();
const deleteUniqueVehicleMock = vi.fn();
const safeParseMock = vi.fn();
const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();

vi.mock("@/app/lib/prisma/uniqueVehicle", () => ({
  getResolvedUniqueVehicle: getResolvedUniqueVehicleMock,
  getUniqueVehicle: getUniqueVehicleMock,
  updateUniqueVehicle: updateUniqueVehicleMock,
  deleteUniqueVehicle: deleteUniqueVehicleMock,
}));

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/types/vehicle", () => ({
  uniqueVehicleUpdateSchema: { safeParse: safeParseMock },
}));

describe("/api/unique-vehicles/[id] route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/unique-vehicles/[id]/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "u-1" })
    );
    expect(response.status).toBe(401);
  });

  it("GET returns 404 when vehicle does not exist", async () => {
    getResolvedUniqueVehicleMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/unique-vehicles/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "u-1" })
    );
    expect(response.status).toBe(404);
  });

  it("GET returns 200 when requester owns vehicle", async () => {
    getResolvedUniqueVehicleMock.mockResolvedValue({
      id: "u-1",
      ownerUserId: "user-1",
      gameId: "g-1",
    });
    const { GET } = await import("@/app/api/unique-vehicles/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "u-1" })
    );
    expect(response.status).toBe(200);
  });

  it("PATCH returns 400 on invalid body", async () => {
    getUniqueVehicleMock.mockResolvedValue({
      id: "u-1",
      ownerUserId: "user-1",
      gameId: "g-1",
    });
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    safeParseMock.mockReturnValue({
      error: { issues: [{ message: "invalid patch" }] },
      data: undefined,
    });
    const { PATCH } = await import("@/app/api/unique-vehicles/[id]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ bad: true }, "user-1"),
      makeParams({ id: "u-1" })
    );
    expect(response.status).toBe(400);
  });

  it("PATCH returns 200 on success for owner", async () => {
    getUniqueVehicleMock.mockResolvedValue({
      id: "u-1",
      ownerUserId: "user-1",
      gameId: "g-1",
    });
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    safeParseMock.mockReturnValue({
      data: { notesOverride: "ok" },
      error: undefined,
    });
    updateUniqueVehicleMock.mockResolvedValue({
      id: "u-1",
      notesOverride: "ok",
    });
    const { PATCH } = await import("@/app/api/unique-vehicles/[id]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ notesOverride: "ok" }, "user-1"),
      makeParams({ id: "u-1" })
    );
    expect(response.status).toBe(200);
  });

  it("DELETE returns 204 on success for game master", async () => {
    getUniqueVehicleMock.mockResolvedValue({
      id: "u-1",
      ownerUserId: "user-2",
      gameId: "g-1",
    });
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    deleteUniqueVehicleMock.mockResolvedValue(undefined);
    const { DELETE } = await import("@/app/api/unique-vehicles/[id]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "u-1" })
    );
    expect(response.status).toBe(204);
  });

  it("DELETE returns 403 when requester is neither owner nor game master", async () => {
    getUniqueVehicleMock.mockResolvedValue({
      id: "u-1",
      ownerUserId: "user-2",
      gameId: "g-1",
    });
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    const { DELETE } = await import("@/app/api/unique-vehicles/[id]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "u-1" })
    );
    expect(response.status).toBe(403);
  });
});
