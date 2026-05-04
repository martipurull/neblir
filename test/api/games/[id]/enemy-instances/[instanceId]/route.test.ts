import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getEnemyInstanceMock = vi.fn();
const updateEnemyInstanceMock = vi.fn();
const deleteEnemyInstanceMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/enemyInstance", () => ({
  getEnemyInstance: getEnemyInstanceMock,
  updateEnemyInstance: updateEnemyInstanceMock,
  deleteEnemyInstance: deleteEnemyInstanceMock,
}));

describe("/api/games/[id]/enemy-instances/[instanceId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const gmGame = { id: "g-1", gameMaster: "gm-1" };
  const instanceRow = {
    id: "ei-1",
    gameId: "g-1",
    name: "Goblin",
    maxHealth: 10,
    currentHealth: 8,
    reactionsPerRound: 2,
    reactionsRemaining: 2,
  };

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeUnauthedRequest(),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 when instanceId missing", async () => {
      const { GET } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "u-1"),
        makeParams({ id: "g-1", instanceId: "" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 when game id is empty", async () => {
      const { GET } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "", instanceId: "ei-1" })
      );
      expect(response.status).toBe(400);
      expect(getGameMock).not.toHaveBeenCalled();
    });

    it("returns 404 when game does not exist", async () => {
      getGameMock.mockResolvedValue(null);
      const { GET } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-missing", instanceId: "ei-1" })
      );
      expect(response.status).toBe(404);
      expect(getEnemyInstanceMock).not.toHaveBeenCalled();
    });

    it("returns 403 when user is not GM and not in game", async () => {
      getGameMock.mockResolvedValue(gmGame);
      userIsInGameMock.mockResolvedValue(false);
      const { GET } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "stranger"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(403);
      expect(getEnemyInstanceMock).not.toHaveBeenCalled();
    });

    it("returns 404 when instance id is unknown", async () => {
      getGameMock.mockResolvedValue(gmGame);
      userIsInGameMock.mockResolvedValue(true);
      getEnemyInstanceMock.mockResolvedValue(null);
      const { GET } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "player-1"),
        makeParams({ id: "g-1", instanceId: "missing" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 200 when game master fetches without membership check", async () => {
      getGameMock.mockResolvedValue(gmGame);
      userIsInGameMock.mockResolvedValue(false);
      getEnemyInstanceMock.mockResolvedValue(instanceRow);
      const { GET } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(200);
      expect(userIsInGameMock).not.toHaveBeenCalled();
    });

    it("returns 404 when instance belongs to another game", async () => {
      getGameMock.mockResolvedValue(gmGame);
      userIsInGameMock.mockResolvedValue(true);
      getEnemyInstanceMock.mockResolvedValue({
        ...instanceRow,
        gameId: "other",
      });
      const { GET } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "player-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 200 when instance matches game", async () => {
      getGameMock.mockResolvedValue(gmGame);
      userIsInGameMock.mockResolvedValue(true);
      getEnemyInstanceMock.mockResolvedValue(instanceRow);
      const { GET } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "player-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(instanceRow);
    });

    it("returns 500 when getEnemyInstance throws", async () => {
      getGameMock.mockResolvedValue(gmGame);
      userIsInGameMock.mockResolvedValue(true);
      getEnemyInstanceMock.mockRejectedValue(new Error("db"));
      const { GET } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "player-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(500);
      expect((await response.json()).message).toBe(
        "Error fetching enemy instance"
      );
    });
  });

  describe("PATCH", () => {
    it("returns 401 when unauthenticated", async () => {
      const { PATCH } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeUnauthedRequest({}),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 when game id is empty", async () => {
      const { PATCH } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "x" }, "gm-1"),
        makeParams({ id: "", instanceId: "ei-1" })
      );
      expect(response.status).toBe(400);
      expect(getGameMock).not.toHaveBeenCalled();
    });

    it("returns 404 when game does not exist", async () => {
      getGameMock.mockResolvedValue(null);
      const { PATCH } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "x" }, "gm-1"),
        makeParams({ id: "g-missing", instanceId: "ei-1" })
      );
      expect(response.status).toBe(404);
      expect(getEnemyInstanceMock).not.toHaveBeenCalled();
    });

    it("returns 404 when instance is unknown", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue(null);
      const { PATCH } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "x" }, "gm-1"),
        makeParams({ id: "g-1", instanceId: "missing" })
      );
      expect(response.status).toBe(404);
      expect(updateEnemyInstanceMock).not.toHaveBeenCalled();
    });

    it("returns 404 when instance belongs to another game", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue({
        ...instanceRow,
        gameId: "other",
      });
      const { PATCH } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "x" }, "gm-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(404);
      expect(updateEnemyInstanceMock).not.toHaveBeenCalled();
    });

    it("returns 400 when request body fails validation", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue(instanceRow);
      const { PATCH } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const emptyName = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "   " }, "gm-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(emptyName.status).toBe(400);
      expect(updateEnemyInstanceMock).not.toHaveBeenCalled();

      const badStatus = await invokeRoute(
        PATCH,
        makeAuthedRequest({ status: "ALIVE" }, "gm-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(badStatus.status).toBe(400);
    });

    it("returns 403 when caller is not game master", async () => {
      getGameMock.mockResolvedValue(gmGame);
      userIsInGameMock.mockResolvedValue(true);
      getEnemyInstanceMock.mockResolvedValue(instanceRow);
      const { PATCH } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Renamed" }, "player-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(403);
    });

    it("returns 400 when currentHealth exceeds maxHealth", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue(instanceRow);
      const { PATCH } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ currentHealth: 999 }, "gm-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(400);
      expect(updateEnemyInstanceMock).not.toHaveBeenCalled();
    });

    it("returns 400 when currentHealth exceeds newly lowered maxHealth", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue(instanceRow);
      const { PATCH } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ maxHealth: 5, currentHealth: 7 }, "gm-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(400);
      expect(updateEnemyInstanceMock).not.toHaveBeenCalled();
    });

    it("returns 400 when reactionsRemaining exceeds cap", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue(instanceRow);
      const { PATCH } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ reactionsRemaining: 10 }, "gm-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(400);
      expect(updateEnemyInstanceMock).not.toHaveBeenCalled();
    });

    it("returns 200 and updates when valid", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue(instanceRow);
      updateEnemyInstanceMock.mockResolvedValue({
        ...instanceRow,
        name: "Renamed",
      });
      const { PATCH } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "Renamed" }, "gm-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(200);
      expect(updateEnemyInstanceMock).toHaveBeenCalledWith("ei-1", {
        name: "Renamed",
      });
    });

    it("returns 200 with empty body and performs no field updates", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue(instanceRow);
      updateEnemyInstanceMock.mockResolvedValue(instanceRow);
      const { PATCH } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({}, "gm-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(200);
      expect(updateEnemyInstanceMock).toHaveBeenCalledWith("ei-1", {});
    });

    it("caps currentHealth when only maxHealth is lowered", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue(instanceRow);
      updateEnemyInstanceMock.mockResolvedValue({
        ...instanceRow,
        maxHealth: 5,
        currentHealth: 5,
      });
      const { PATCH } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ maxHealth: 5 }, "gm-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(200);
      expect(updateEnemyInstanceMock).toHaveBeenCalledWith("ei-1", {
        maxHealth: 5,
        currentHealth: 5,
      });
    });

    it("caps reactionsRemaining when only reactionsPerRound is lowered", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue(instanceRow);
      updateEnemyInstanceMock.mockResolvedValue({
        ...instanceRow,
        reactionsPerRound: 1,
        reactionsRemaining: 1,
      });
      const { PATCH } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ reactionsPerRound: 1 }, "gm-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(200);
      expect(updateEnemyInstanceMock).toHaveBeenCalledWith("ei-1", {
        reactionsPerRound: 1,
        reactionsRemaining: 1,
      });
    });

    it("returns 200 when patching notes description and status", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue(instanceRow);
      updateEnemyInstanceMock.mockResolvedValue({
        ...instanceRow,
        notes: "<p>x</p>",
        description: null,
        status: "DEFEATED",
      });
      const { PATCH } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest(
          {
            notes: "<p>x</p>",
            description: null,
            status: "DEFEATED",
            imageKey: null,
            speed: 30,
            initiativeModifier: -1,
          },
          "gm-1"
        ),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(200);
      expect(updateEnemyInstanceMock).toHaveBeenCalledWith("ei-1", {
        notes: "<p>x</p>",
        description: null,
        status: "DEFEATED",
        imageKey: null,
        speed: 30,
        initiativeModifier: -1,
      });
    });

    it("returns 500 when updateEnemyInstance rejects", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue(instanceRow);
      updateEnemyInstanceMock.mockRejectedValue(new Error("write fail"));
      const { PATCH } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ name: "X" }, "gm-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(500);
      expect((await response.json()).message).toBe(
        "Error updating enemy instance"
      );
    });
  });

  describe("DELETE", () => {
    it("returns 401 when unauthenticated", async () => {
      const { DELETE } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeUnauthedRequest(),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when caller is not game master", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue(instanceRow);
      const { DELETE } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "player-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(403);
      expect(deleteEnemyInstanceMock).not.toHaveBeenCalled();
    });

    it("returns 400 when game id is empty", async () => {
      const { DELETE } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "", instanceId: "ei-1" })
      );
      expect(response.status).toBe(400);
      expect(getGameMock).not.toHaveBeenCalled();
    });

    it("returns 404 when game does not exist", async () => {
      getGameMock.mockResolvedValue(null);
      const { DELETE } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-missing", instanceId: "ei-1" })
      );
      expect(response.status).toBe(404);
      expect(deleteEnemyInstanceMock).not.toHaveBeenCalled();
    });

    it("returns 404 when instance is unknown", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue(null);
      const { DELETE } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1", instanceId: "missing" })
      );
      expect(response.status).toBe(404);
      expect(deleteEnemyInstanceMock).not.toHaveBeenCalled();
    });

    it("returns 404 when instance belongs to another game", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue({
        ...instanceRow,
        gameId: "other",
      });
      const { DELETE } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(404);
      expect(deleteEnemyInstanceMock).not.toHaveBeenCalled();
    });

    it("returns 204 when GM deletes instance", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue(instanceRow);
      deleteEnemyInstanceMock.mockResolvedValue(undefined);
      const { DELETE } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(204);
      expect(deleteEnemyInstanceMock).toHaveBeenCalledWith("ei-1");
    });

    it("returns 500 when deleteEnemyInstance rejects", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyInstanceMock.mockResolvedValue(instanceRow);
      deleteEnemyInstanceMock.mockRejectedValue(new Error("db"));
      const { DELETE } = await import(
        "@/app/api/games/[id]/enemy-instances/[instanceId]/route"
      );
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1", instanceId: "ei-1" })
      );
      expect(response.status).toBe(500);
      expect((await response.json()).message).toBe(
        "Error deleting enemy instance"
      );
    });
  });
});
