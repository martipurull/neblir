import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const getMapsMock = vi.fn();
const createMapMock = vi.fn();
const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();

vi.mock("@/app/lib/prisma/map", () => ({
  getMaps: getMapsMock,
  createMap: createMapMock,
}));

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

function requestWithSearch(search: string, userId = "user-1") {
  return {
    ...makeAuthedRequest(undefined, userId),
    nextUrl: { searchParams: new URLSearchParams(search) },
  } as any;
}

describe("/api/maps route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } = await import("@/app/api/maps/route");
      const request = {
        ...makeUnauthedRequest(),
        nextUrl: { searchParams: new URLSearchParams("") },
      } as any;

      const response = await invokeRoute(GET, request);
      expect(response.status).toBe(401);
    });

    it("returns 403 for game maps when user is not in the game", async () => {
      userIsInGameMock.mockResolvedValue(false);
      const { GET } = await import("@/app/api/maps/route");

      const response = await invokeRoute(
        GET,
        requestWithSearch("gameId=game-1")
      );

      expect(response.status).toBe(403);
      expect(getMapsMock).not.toHaveBeenCalled();
    });

    it("returns global maps", async () => {
      getMapsMock.mockResolvedValue([{ id: "m-1", name: "World Map" }]);
      const { GET } = await import("@/app/api/maps/route");

      const response = await invokeRoute(GET, requestWithSearch(""));

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([
        { id: "m-1", name: "World Map" },
      ]);
      expect(getMapsMock).toHaveBeenCalledWith({ gameId: null });
    });

    it("returns game maps for game members", async () => {
      userIsInGameMock.mockResolvedValue(true);
      getMapsMock.mockResolvedValue([{ id: "m-1", gameId: "game-1" }]);
      const { GET } = await import("@/app/api/maps/route");

      const response = await invokeRoute(
        GET,
        requestWithSearch("gameId=game-1")
      );

      expect(response.status).toBe(200);
      expect(getMapsMock).toHaveBeenCalledWith({ gameId: "game-1" });
    });

    it("returns 500 when fetching throws", async () => {
      getMapsMock.mockRejectedValue(new Error("db down"));
      const { GET } = await import("@/app/api/maps/route");

      const response = await invokeRoute(GET, requestWithSearch(""));

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toMatchObject({
        message: "Error fetching maps",
      });
    });
  });

  describe("POST", () => {
    it("returns 401 when unauthenticated", async () => {
      const { POST } = await import("@/app/api/maps/route");
      const response = await invokeRoute(POST, makeUnauthedRequest());

      expect(response.status).toBe(401);
    });

    it("returns 400 for invalid body", async () => {
      const { POST } = await import("@/app/api/maps/route");
      const response = await invokeRoute(POST, makeAuthedRequest({ name: "" }));

      expect(response.status).toBe(400);
      expect(createMapMock).not.toHaveBeenCalled();
    });

    it("returns 404 when a scoped game does not exist", async () => {
      getGameMock.mockResolvedValue(null);
      const { POST } = await import("@/app/api/maps/route");

      const response = await invokeRoute(
        POST,
        makeAuthedRequest({
          name: "Battlefield",
          imageKey: "maps/battlefield.png",
          gameId: "game-1",
        })
      );

      expect(response.status).toBe(404);
    });

    it("returns 403 when creating scoped maps as a non-GM", async () => {
      getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "gm-1" });
      const { POST } = await import("@/app/api/maps/route");

      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            name: "Battlefield",
            imageKey: "maps/battlefield.png",
            gameId: "game-1",
          },
          "player-1"
        )
      );

      expect(response.status).toBe(403);
      expect(createMapMock).not.toHaveBeenCalled();
    });

    it("returns 201 for global maps", async () => {
      createMapMock.mockResolvedValue({ id: "m-1", name: "World Map" });
      const { POST } = await import("@/app/api/maps/route");

      const response = await invokeRoute(
        POST,
        makeAuthedRequest({
          name: "World Map",
          imageKey: "maps/world.png",
        })
      );

      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual({
        id: "m-1",
        name: "World Map",
      });
    });

    it("returns 201 for scoped maps created by the GM", async () => {
      getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "gm-1" });
      createMapMock.mockResolvedValue({ id: "m-1" });
      const { POST } = await import("@/app/api/maps/route");

      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            name: "Battlefield",
            imageKey: "maps/battlefield.png",
            gameId: "game-1",
          },
          "gm-1"
        )
      );

      expect(response.status).toBe(201);
      expect(createMapMock).toHaveBeenCalled();
    });

    it("returns 500 when creation throws", async () => {
      createMapMock.mockRejectedValue(new Error("db down"));
      const { POST } = await import("@/app/api/maps/route");

      const response = await invokeRoute(
        POST,
        makeAuthedRequest({
          name: "World Map",
          imageKey: "maps/world.png",
        })
      );

      expect(response.status).toBe(500);
    });
  });
});
