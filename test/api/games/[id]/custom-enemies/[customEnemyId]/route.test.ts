import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getCustomEnemyMock = vi.fn();
const updateCustomEnemyMock = vi.fn();
const deleteCustomEnemyMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/customEnemy", () => ({
  getCustomEnemy: getCustomEnemyMock,
  updateCustomEnemy: updateCustomEnemyMock,
  deleteCustomEnemy: deleteCustomEnemyMock,
}));

const params = (
  overrides: Partial<{ id: string; customEnemyId: string }> = {}
) => makeParams({ id: "g-1", customEnemyId: "ce-1", ...overrides });

describe("/api/games/[id]/custom-enemies/[customEnemyId] route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(GET, makeUnauthedRequest(), params());
      expect(response.status).toBe(401);
    });

    it("returns 400 when game id or customEnemyId is missing", async () => {
      const { GET } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        params({ customEnemyId: "" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 when game id is empty", async () => {
      const { GET } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        params({ id: "", customEnemyId: "ce-1" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 404 when game not found", async () => {
      getGameMock.mockResolvedValue(null);
      const { GET } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(GET, makeAuthedRequest(), params());
      expect(response.status).toBe(404);
    });

    it("returns 403 when user has no access", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      userIsInGameMock.mockResolvedValue(false);
      const { GET } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "outsider"),
        params()
      );
      expect(response.status).toBe(403);
    });

    it("returns 404 when enemy belongs to another game", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      userIsInGameMock.mockResolvedValue(true);
      getCustomEnemyMock.mockResolvedValue({
        id: "ce-1",
        gameId: "other-game",
      });
      const { GET } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "player-1"),
        params()
      );
      expect(response.status).toBe(404);
    });

    it("returns 404 when enemy does not exist", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      userIsInGameMock.mockResolvedValue(true);
      getCustomEnemyMock.mockResolvedValue(null);
      const { GET } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "player-1"),
        params()
      );
      expect(response.status).toBe(404);
    });

    it("returns 200 when enemy exists and user can access game", async () => {
      const enemy = { id: "ce-1", gameId: "g-1", name: "Skulk" };
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-2" });
      userIsInGameMock.mockResolvedValue(true);
      getCustomEnemyMock.mockResolvedValue(enemy);
      const { GET } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "player-1"),
        params()
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(enemy);
    });

    it("returns 500 when getCustomEnemy throws", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      userIsInGameMock.mockResolvedValue(true);
      getCustomEnemyMock.mockRejectedValue(new Error("read error"));
      const { GET } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "player-1"),
        params()
      );
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.message).toBe("Error fetching custom enemy");
    });
  });

  describe("PATCH", () => {
    it("returns 401 when unauthenticated", async () => {
      const { PATCH } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeUnauthedRequest({}),
        params()
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 when ids invalid", async () => {
      const { PATCH } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "x" }, "gm-1"),
        params({ id: "" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 404 when game not found", async () => {
      getGameMock.mockResolvedValue(null);
      const { PATCH } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "x" }, "gm-1"),
        params()
      );
      expect(response.status).toBe(404);
    });

    it("returns 403 when caller is not game master", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      const { PATCH } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Renamed" }, "player-1"),
        params()
      );
      expect(response.status).toBe(403);
      expect(getCustomEnemyMock).not.toHaveBeenCalled();
    });

    it("returns 404 when enemy missing or wrong game", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      getCustomEnemyMock.mockResolvedValue({ id: "ce-1", gameId: "g-2" });
      const { PATCH } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Renamed" }, "gm-1"),
        params()
      );
      expect(response.status).toBe(404);
    });

    it("returns 400 when JSON body fails update schema", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      getCustomEnemyMock.mockResolvedValue({ id: "ce-1", gameId: "g-1" });
      const { PATCH } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ health: "not-a-number" }, "gm-1"),
        params()
      );
      expect(response.status).toBe(400);
      expect(updateCustomEnemyMock).not.toHaveBeenCalled();
    });

    it("returns 200 on success", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      getCustomEnemyMock.mockResolvedValue({ id: "ce-1", gameId: "g-1" });
      updateCustomEnemyMock.mockResolvedValue({
        id: "ce-1",
        name: "Renamed",
        gameId: "g-1",
      });
      const { PATCH } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Renamed" }, "gm-1"),
        params()
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        id: "ce-1",
        name: "Renamed",
      });
      expect(updateCustomEnemyMock).toHaveBeenCalledWith(
        "ce-1",
        expect.objectContaining({ name: "Renamed" })
      );
    });

    it("returns 500 when updateCustomEnemy throws", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      getCustomEnemyMock.mockResolvedValue({ id: "ce-1", gameId: "g-1" });
      updateCustomEnemyMock.mockRejectedValue(new Error("conflict"));
      const { PATCH } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Renamed" }, "gm-1"),
        params()
      );
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.message).toBe("Error updating custom enemy");
    });
  });

  describe("DELETE", () => {
    it("returns 401 when unauthenticated", async () => {
      const { DELETE } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeUnauthedRequest(),
        params()
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 when customEnemyId is empty", async () => {
      const { DELETE } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        params({ customEnemyId: "" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 403 when caller is not game master", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      const { DELETE } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "player-1"),
        params()
      );
      expect(response.status).toBe(403);
    });

    it("returns 404 when game not found", async () => {
      getGameMock.mockResolvedValue(null);
      const { DELETE } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        params()
      );
      expect(response.status).toBe(404);
    });

    it("returns 404 when enemy not in game", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      getCustomEnemyMock.mockResolvedValue(null);
      const { DELETE } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        params()
      );
      expect(response.status).toBe(404);
    });

    it("returns 204 on success", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      getCustomEnemyMock.mockResolvedValue({ id: "ce-1", gameId: "g-1" });
      deleteCustomEnemyMock.mockResolvedValue(undefined);
      const { DELETE } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        params()
      );
      expect(response.status).toBe(204);
      expect(deleteCustomEnemyMock).toHaveBeenCalledWith("ce-1");
    });

    it("returns 500 when deleteCustomEnemy throws", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      getCustomEnemyMock.mockResolvedValue({ id: "ce-1", gameId: "g-1" });
      deleteCustomEnemyMock.mockRejectedValue(new Error("fk constraint"));
      const { DELETE } = await import(
        "@/app/api/games/[id]/custom-enemies/[customEnemyId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        params()
      );
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.message).toBe("Error deleting custom enemy");
    });
  });
});
