import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";

const getMapMock = vi.fn();
const updateMapMock = vi.fn();
const deleteMapMock = vi.fn();
const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();

vi.mock("@/app/lib/prisma/map", () => ({
  getMap: getMapMock,
  updateMap: updateMapMock,
  deleteMap: deleteMapMock,
}));

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

const globalMap = {
  id: "m-1",
  name: "World Map",
  imageKey: "maps/world.png",
  gameId: null,
};

describe("/api/maps/[id] route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } = await import("@/app/api/maps/[id]/route");
      const response = await invokeRoute(
        GET,
        makeUnauthedRequest(),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(401);
    });

    it("returns 404 when map is missing", async () => {
      getMapMock.mockResolvedValue(null);
      const { GET } = await import("@/app/api/maps/[id]/route");

      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(404);
    });

    it("returns 403 for game maps when user is not in the game", async () => {
      getMapMock.mockResolvedValue({ ...globalMap, gameId: "game-1" });
      userIsInGameMock.mockResolvedValue(false);
      const { GET } = await import("@/app/api/maps/[id]/route");

      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(403);
    });

    it("returns 200 for global maps", async () => {
      getMapMock.mockResolvedValue(globalMap);
      const { GET } = await import("@/app/api/maps/[id]/route");

      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(globalMap);
    });

    it("returns 200 for game maps when user is in the game", async () => {
      getMapMock.mockResolvedValue({ ...globalMap, gameId: "game-1" });
      userIsInGameMock.mockResolvedValue(true);
      const { GET } = await import("@/app/api/maps/[id]/route");

      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(200);
    });

    it("returns 500 when fetching throws", async () => {
      getMapMock.mockRejectedValue(new Error("db down"));
      const { GET } = await import("@/app/api/maps/[id]/route");

      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(500);
    });
  });

  describe("PATCH", () => {
    it("returns 401 when unauthenticated", async () => {
      const { PATCH } = await import("@/app/api/maps/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeUnauthedRequest(),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(401);
    });

    it("returns 404 when map is missing", async () => {
      getMapMock.mockResolvedValue(null);
      const { PATCH } = await import("@/app/api/maps/[id]/route");

      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Updated" }),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(404);
    });

    it("returns 403 when a non-GM updates a game map", async () => {
      getMapMock.mockResolvedValue({ ...globalMap, gameId: "game-1" });
      getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "gm-1" });
      const { PATCH } = await import("@/app/api/maps/[id]/route");

      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Updated" }, "player-1"),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(403);
    });

    it("returns 400 for invalid body", async () => {
      getMapMock.mockResolvedValue(globalMap);
      const { PATCH } = await import("@/app/api/maps/[id]/route");

      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "" }),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(400);
    });

    it("returns 404 when moving to a missing game", async () => {
      getMapMock.mockResolvedValue(globalMap);
      getGameMock.mockResolvedValue(null);
      const { PATCH } = await import("@/app/api/maps/[id]/route");

      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ gameId: "game-2" }),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(404);
    });

    it("returns 403 when moving to a game the user does not GM", async () => {
      getMapMock.mockResolvedValue(globalMap);
      getGameMock.mockResolvedValue({ id: "game-2", gameMaster: "gm-2" });
      const { PATCH } = await import("@/app/api/maps/[id]/route");

      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ gameId: "game-2" }, "gm-1"),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(403);
    });

    it("returns 200 on success", async () => {
      getMapMock.mockResolvedValue(globalMap);
      updateMapMock.mockResolvedValue({ ...globalMap, name: "Updated" });
      const { PATCH } = await import("@/app/api/maps/[id]/route");

      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Updated" }),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(200);
      expect(updateMapMock).toHaveBeenCalledWith("m-1", { name: "Updated" });
    });

    it("returns 500 when update throws", async () => {
      getMapMock.mockResolvedValue(globalMap);
      updateMapMock.mockRejectedValue(new Error("db down"));
      const { PATCH } = await import("@/app/api/maps/[id]/route");

      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Updated" }),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(500);
    });
  });

  describe("DELETE", () => {
    it("returns 401 when unauthenticated", async () => {
      const { DELETE } = await import("@/app/api/maps/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeUnauthedRequest(),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(401);
    });

    it("returns 404 when map is missing", async () => {
      getMapMock.mockResolvedValue(null);
      const { DELETE } = await import("@/app/api/maps/[id]/route");

      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(404);
    });

    it("returns 403 when a non-GM deletes a game map", async () => {
      getMapMock.mockResolvedValue({ ...globalMap, gameId: "game-1" });
      getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "gm-1" });
      const { DELETE } = await import("@/app/api/maps/[id]/route");

      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "player-1"),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(403);
    });

    it("returns 204 on success", async () => {
      getMapMock.mockResolvedValue(globalMap);
      deleteMapMock.mockResolvedValue(globalMap);
      const { DELETE } = await import("@/app/api/maps/[id]/route");

      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(204);
      expect(deleteMapMock).toHaveBeenCalledWith("m-1");
    });

    it("returns 500 when delete throws", async () => {
      getMapMock.mockResolvedValue(globalMap);
      deleteMapMock.mockRejectedValue(new Error("db down"));
      const { DELETE } = await import("@/app/api/maps/[id]/route");

      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "m-1" })
      );

      expect(response.status).toBe(500);
    });
  });
});
