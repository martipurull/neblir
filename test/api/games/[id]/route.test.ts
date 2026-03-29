import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";

const getGameWithDetailsMock = vi.fn();
const updateGameMock = vi.fn();
const deleteGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGameWithDetails: getGameWithDetailsMock,
  updateGame: updateGameMock,
  deleteGame: deleteGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/types/game", () => ({
  gameUpdateSchema: { safeParse: safeParseMock },
}));

describe("/api/games/[id] handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } = await import("@/app/api/games/[id]/route");
      const response = await invokeRoute(
        GET,
        makeUnauthedRequest(),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 for invalid id", async () => {
      const { GET } = await import("@/app/api/games/[id]/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 404 when game does not exist", async () => {
      getGameWithDetailsMock.mockResolvedValue(null);
      const { GET } = await import("@/app/api/games/[id]/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "user-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 403 when user is not in game", async () => {
      getGameWithDetailsMock.mockResolvedValue({
        id: "g-1",
        gameMaster: "gm-1",
        name: "Game",
        users: [],
        characters: [],
        customItems: [],
      });
      userIsInGameMock.mockResolvedValue(false);
      const { GET } = await import("@/app/api/games/[id]/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "user-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
    });

    it("returns 200 with game when user is in game", async () => {
      const game = {
        id: "g-1",
        gameMaster: "gm-1",
        name: "Game",
        users: [],
        characters: [],
        customItems: [],
      };
      getGameWithDetailsMock.mockResolvedValue(game);
      userIsInGameMock.mockResolvedValue(true);
      const { GET } = await import("@/app/api/games/[id]/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "user-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe("g-1");
      expect(data.isGameMaster).toBe(false);
    });
  });

  describe("PATCH", () => {
    it("returns 401 when unauthenticated", async () => {
      const { PATCH } = await import("@/app/api/games/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeUnauthedRequest({ name: "Updated" }),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 for invalid id", async () => {
      const { PATCH } = await import("@/app/api/games/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Updated" }),
        makeParams({ id: "" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 404 when game does not exist", async () => {
      getGameWithDetailsMock.mockResolvedValue(null);
      const { PATCH } = await import("@/app/api/games/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Updated" }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 403 when user is not game master", async () => {
      getGameWithDetailsMock.mockResolvedValue({
        id: "g-1",
        gameMaster: "gm-1",
        name: "Game",
      });
      const { PATCH } = await import("@/app/api/games/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Updated" }, "user-2"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
    });

    it("returns 400 when payload is invalid", async () => {
      getGameWithDetailsMock.mockResolvedValue({
        id: "g-1",
        gameMaster: "gm-1",
        name: "Game",
      });
      safeParseMock.mockReturnValue({
        data: undefined,
        error: { issues: [{ message: "invalid update" }] },
      });
      const { PATCH } = await import("@/app/api/games/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ bad: true }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 200 when update succeeds", async () => {
      const game = {
        id: "g-1",
        gameMaster: "gm-1",
        name: "Updated",
        users: [],
        characters: [],
        customItems: [],
      };
      getGameWithDetailsMock.mockResolvedValue(game);
      safeParseMock.mockReturnValue({
        data: { name: "Updated" },
        error: undefined,
      });
      updateGameMock.mockResolvedValue(undefined);
      const { PATCH } = await import("@/app/api/games/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Updated" }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(200);
      expect(updateGameMock).toHaveBeenCalledWith("g-1", { name: "Updated" });
    });
  });

  describe("DELETE", () => {
    it("returns 401 when unauthenticated", async () => {
      const { DELETE } = await import("@/app/api/games/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeUnauthedRequest(),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 204 on success", async () => {
      deleteGameMock.mockResolvedValue(undefined);
      const { DELETE } = await import("@/app/api/games/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(204);
    });
  });
});
