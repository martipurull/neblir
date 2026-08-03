import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getCustomVehicleMock = vi.fn();
const updateCustomVehicleMock = vi.fn();
const deleteCustomVehicleMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/vehicle", () => ({
  getCustomVehicle: getCustomVehicleMock,
  updateCustomVehicle: updateCustomVehicleMock,
  deleteCustomVehicle: deleteCustomVehicleMock,
}));

vi.mock("@/app/lib/types/vehicle", () => ({
  customVehicleUpdateSchema: { safeParse: safeParseMock },
}));

describe("/api/games/[id]/custom-vehicles/[vehicleId] handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } =
      await import("@/app/api/games/[id]/custom-vehicles/[vehicleId]/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "g-1", vehicleId: "cv-1" })
    );
    expect(response.status).toBe(401);
  });

  it("GET returns 404 when game not found", async () => {
    getGameMock.mockResolvedValue(null);
    const { GET } =
      await import("@/app/api/games/[id]/custom-vehicles/[vehicleId]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "g-1", vehicleId: "cv-1" })
    );
    expect(response.status).toBe(404);
  });

  it("GET returns 200 when vehicle exists and user can access game", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-2" });
    userIsInGameMock.mockResolvedValue(true);
    getCustomVehicleMock.mockResolvedValue({ id: "cv-1", gameId: "g-1" });
    const { GET } =
      await import("@/app/api/games/[id]/custom-vehicles/[vehicleId]/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "g-1", vehicleId: "cv-1" })
    );
    expect(response.status).toBe(200);
  });

  it("PATCH returns 403 when user is not game master", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "other-gm" });
    getCustomVehicleMock.mockResolvedValue({ id: "cv-1", gameId: "g-1" });
    const { PATCH } =
      await import("@/app/api/games/[id]/custom-vehicles/[vehicleId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "updated" }, "user-1"),
      makeParams({ id: "g-1", vehicleId: "cv-1" })
    );
    expect(response.status).toBe(403);
    expect(updateCustomVehicleMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 400 when payload is invalid", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "user-1" });
    getCustomVehicleMock.mockResolvedValue({ id: "cv-1", gameId: "g-1" });
    safeParseMock.mockReturnValue({
      error: { issues: [{ message: "bad payload" }] },
      data: undefined,
    });
    const { PATCH } =
      await import("@/app/api/games/[id]/custom-vehicles/[vehicleId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ bad: true }),
      makeParams({ id: "g-1", vehicleId: "cv-1" })
    );
    expect(response.status).toBe(400);
  });

  it("PATCH returns 200 on success", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "user-1" });
    getCustomVehicleMock.mockResolvedValue({ id: "cv-1", gameId: "g-1" });
    safeParseMock.mockReturnValue({
      data: { name: "updated" },
      error: undefined,
    });
    updateCustomVehicleMock.mockResolvedValue({ id: "cv-1", name: "updated" });
    const { PATCH } =
      await import("@/app/api/games/[id]/custom-vehicles/[vehicleId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "updated" }),
      makeParams({ id: "g-1", vehicleId: "cv-1" })
    );
    expect(response.status).toBe(200);
  });

  it("DELETE returns 204 on success", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "user-1" });
    getCustomVehicleMock.mockResolvedValue({ id: "cv-1", gameId: "g-1" });
    deleteCustomVehicleMock.mockResolvedValue(undefined);
    const { DELETE } =
      await import("@/app/api/games/[id]/custom-vehicles/[vehicleId]/route");

    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(),
      makeParams({ id: "g-1", vehicleId: "cv-1" })
    );
    expect(response.status).toBe(204);
  });
});
