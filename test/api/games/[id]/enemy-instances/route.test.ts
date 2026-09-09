import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getEnemyInstancesByGameMock = vi.fn();
const createEnemyInstanceMock = vi.fn();
const deleteEnemyInstancesForGameMock = vi.fn();
const getCustomEnemyMock = vi.fn();
const getEnemyMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/enemyInstance", () => ({
  createEnemyInstance: createEnemyInstanceMock,
  getEnemyInstancesByGame: getEnemyInstancesByGameMock,
  deleteEnemyInstancesForGame: deleteEnemyInstancesForGameMock,
}));

vi.mock("@/app/lib/prisma/customEnemy", () => ({
  getCustomEnemy: getCustomEnemyMock,
}));

vi.mock("@/app/lib/prisma/enemy", () => ({
  getEnemy: getEnemyMock,
}));

const spawnTemplate = {
  imageKey: null,
  description: null,
  notes: null,
  health: 10,
  speed: 4,
  initiativeModifier: 1,
  numberOfReactions: 2,
  defenceMelee: 0,
  defenceRange: 0,
  defenceGrid: 0,
  attackMelee: 0,
  attackRange: 0,
  attackThrow: 0,
  attackGrid: 0,
  immunities: [],
  resistances: [],
  vulnerabilities: [],
  actions: [],
  additionalActions: [],
};

function echoCreatedInstances() {
  let n = 0;
  createEnemyInstanceMock.mockImplementation(async (data: object) => ({
    id: `created-${++n}`,
    ...data,
  }));
}

describe("/api/games/[id]/enemy-instances", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getEnemyInstancesByGameMock.mockResolvedValue([]);
  });

  const gmGame = { id: "g-1", gameMaster: "gm-1" };

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        GET,
        makeUnauthedRequest(),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 when game id missing", async () => {
      const { GET } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "" })
      );
      expect(response.status).toBe(400);
      expect(getGameMock).not.toHaveBeenCalled();
    });

    it("returns 404 when game does not exist", async () => {
      getGameMock.mockResolvedValue(null);
      const { GET } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "u-1"),
        makeParams({ id: "g-missing" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 403 when user not in game and not GM", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      userIsInGameMock.mockResolvedValue(false);
      const { GET } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "stranger"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
      expect(getEnemyInstancesByGameMock).not.toHaveBeenCalled();
    });

    it("returns 200 and list when player is in game", async () => {
      getGameMock.mockResolvedValue(gmGame);
      userIsInGameMock.mockResolvedValue(true);
      getEnemyInstancesByGameMock.mockResolvedValue([
        { id: "ei-1", name: "Goblin" },
      ]);
      const { GET } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "player-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual([
        { id: "ei-1", name: "Goblin", instanceLabel: "Goblin" },
      ]);
      expect(getEnemyInstancesByGameMock).toHaveBeenCalledWith("g-1");
    });

    it("returns 200 and list when caller is game master without checking membership", async () => {
      getGameMock.mockResolvedValue(gmGame);
      userIsInGameMock.mockResolvedValue(false);
      getEnemyInstancesByGameMock.mockResolvedValue([]);
      const { GET } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([]);
      expect(userIsInGameMock).not.toHaveBeenCalled();
      expect(getEnemyInstancesByGameMock).toHaveBeenCalledWith("g-1");
    });

    it("returns 500 when getGame throws", async () => {
      getGameMock.mockRejectedValue(new Error("db down"));
      const { GET } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.message).toBe("Error fetching enemy instances");
    });

    it("returns 500 when getEnemyInstancesByGame throws", async () => {
      getGameMock.mockResolvedValue(gmGame);
      userIsInGameMock.mockResolvedValue(true);
      getEnemyInstancesByGameMock.mockRejectedValue(new Error("read fail"));
      const { GET } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "player-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(500);
      expect((await response.json()).message).toBe(
        "Error fetching enemy instances"
      );
    });
  });

  describe("POST", () => {
    it("returns 401 when unauthenticated", async () => {
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeUnauthedRequest({}),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when caller is not game master", async () => {
      getGameMock.mockResolvedValue(gmGame);
      userIsInGameMock.mockResolvedValue(true);
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ sourceCustomEnemyId: "ce-1" }, "player-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
      expect(createEnemyInstanceMock).not.toHaveBeenCalled();
    });

    it("returns 400 when game id is empty", async () => {
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ sourceOfficialEnemyId: "oe-1" }, "gm-1"),
        makeParams({ id: "" })
      );
      expect(response.status).toBe(400);
      expect(getGameMock).not.toHaveBeenCalled();
    });

    it("returns 404 when game does not exist", async () => {
      getGameMock.mockResolvedValue(null);
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ sourceOfficialEnemyId: "oe-1" }, "gm-1"),
        makeParams({ id: "missing" })
      );
      expect(response.status).toBe(404);
      expect(createEnemyInstanceMock).not.toHaveBeenCalled();
    });

    it("returns 400 when neither source id is sent", async () => {
      getGameMock.mockResolvedValue(gmGame);
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({}, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 when both source ids are sent", async () => {
      getGameMock.mockResolvedValue(gmGame);
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          { sourceCustomEnemyId: "ce-1", sourceOfficialEnemyId: "oe-1" },
          "gm-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 when count is out of range", async () => {
      getGameMock.mockResolvedValue(gmGame);
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const low = await invokeRoute(
        POST,
        makeAuthedRequest({ sourceOfficialEnemyId: "oe-1", count: 0 }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(low.status).toBe(400);

      const high = await invokeRoute(
        POST,
        makeAuthedRequest({ sourceOfficialEnemyId: "oe-1", count: 51 }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(high.status).toBe(400);
    });

    it("returns 404 when custom template is not in this game", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getCustomEnemyMock.mockResolvedValue({
        id: "ce-1",
        gameId: "other-game",
        name: "X",
      });
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ sourceCustomEnemyId: "ce-1" }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 404 when custom template id is unknown", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getCustomEnemyMock.mockResolvedValue(null);
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ sourceCustomEnemyId: "ce-missing" }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(404);
      expect(createEnemyInstanceMock).not.toHaveBeenCalled();
    });

    it("returns 404 when official enemy id does not exist", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyMock.mockResolvedValue(null);
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ sourceOfficialEnemyId: "missing" }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 201 with one instance from custom template", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getCustomEnemyMock.mockResolvedValue({
        ...spawnTemplate,
        id: "ce-1",
        gameId: "g-1",
        name: "Goblin",
      });
      echoCreatedInstances();
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ sourceCustomEnemyId: "ce-1" }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      expect(createEnemyInstanceMock).toHaveBeenCalledTimes(1);
      expect(createEnemyInstanceMock.mock.calls[0][0]).toMatchObject({
        name: "Goblin",
        instanceNumber: 1,
        sourceName: "Goblin",
        renamed: false,
        numberVisible: false,
        sourceCustomEnemyId: "ce-1",
      });
      const body = await response.json();
      expect(body.instances).toEqual([
        expect.objectContaining({
          id: "created-1",
          name: "Goblin",
          instanceNumber: 1,
          sourceName: "Goblin",
          renamed: false,
          instanceLabel: "Goblin",
        }),
      ]);
    });

    it("returns 201 with multiple named instances from official enemy", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyMock.mockResolvedValue({
        ...spawnTemplate,
        id: "oe-1",
        name: "Bandit",
      });
      echoCreatedInstances();
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          { sourceOfficialEnemyId: "oe-1", count: 2, nameOverride: "Brigand" },
          "gm-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      expect(createEnemyInstanceMock).toHaveBeenCalledTimes(2);
      expect(createEnemyInstanceMock.mock.calls[0][0]).toMatchObject({
        name: "Brigand",
        instanceNumber: 1,
        sourceName: "Bandit",
        renamed: false,
        numberVisible: true,
        sourceOfficialEnemyId: "oe-1",
      });
      expect(createEnemyInstanceMock.mock.calls[1][0]).toMatchObject({
        name: "Brigand",
        instanceNumber: 2,
        sourceName: "Bandit",
        renamed: false,
      });
      expect(
        createEnemyInstanceMock.mock.calls[0][0].sourceCustomEnemyId
      ).toBeUndefined();
      const body = await response.json();
      expect(body.instances).toEqual([
        expect.objectContaining({
          name: "Brigand",
          instanceNumber: 1,
          sourceName: "Bandit",
          renamed: false,
          instanceLabel: "Brigand #1",
        }),
        expect.objectContaining({
          name: "Brigand",
          instanceNumber: 2,
          sourceName: "Bandit",
          renamed: false,
          instanceLabel: "Brigand #2",
        }),
      ]);
    });

    it("continues instance numbers from siblings still on the table", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getCustomEnemyMock.mockResolvedValue({
        ...spawnTemplate,
        id: "ce-1",
        gameId: "g-1",
        name: "Goblin",
      });
      getEnemyInstancesByGameMock.mockResolvedValue([
        {
          name: "Goblin",
          instanceNumber: 1,
          sourceCustomEnemyId: "ce-1",
          status: "ACTIVE",
        },
        {
          name: "Goblin",
          instanceNumber: 3,
          sourceCustomEnemyId: "ce-1",
          status: "DEFEATED",
        },
      ]);
      echoCreatedInstances();
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ sourceCustomEnemyId: "ce-1", count: 1 }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      expect(createEnemyInstanceMock.mock.calls[0][0]).toMatchObject({
        name: "Goblin",
        instanceNumber: 4,
        sourceName: "Goblin",
        renamed: false,
      });
    });

    it("lets dead instances of the same template occupy their numbers", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getCustomEnemyMock.mockResolvedValue({
        ...spawnTemplate,
        id: "ce-1",
        gameId: "g-1",
        name: "Goblin",
      });
      getEnemyInstancesByGameMock.mockResolvedValue([
        {
          name: "Goblin",
          instanceNumber: 2,
          sourceCustomEnemyId: "ce-1",
          status: "DEAD",
        },
      ]);
      echoCreatedInstances();
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ sourceCustomEnemyId: "ce-1" }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      expect(createEnemyInstanceMock.mock.calls[0][0].instanceNumber).toBe(3);
    });

    it("does not share a counter with another template of the same display name", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getEnemyMock.mockResolvedValue({
        ...spawnTemplate,
        id: "oe-1",
        name: "Guard",
      });
      getEnemyInstancesByGameMock.mockResolvedValue([
        {
          name: "Guard",
          instanceNumber: 5,
          sourceCustomEnemyId: "ce-other",
          sourceOfficialEnemyId: null,
        },
      ]);
      echoCreatedInstances();
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ sourceOfficialEnemyId: "oe-1" }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      expect(createEnemyInstanceMock.mock.calls[0][0].instanceNumber).toBe(1);
    });

    it("recovers occupied numbers from a legacy #N in name", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getCustomEnemyMock.mockResolvedValue({
        ...spawnTemplate,
        id: "ce-1",
        gameId: "g-1",
        name: "Goblin",
      });
      getEnemyInstancesByGameMock.mockResolvedValue([
        {
          name: "Goblin #3",
          sourceCustomEnemyId: "ce-1",
        },
      ]);
      echoCreatedInstances();
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ sourceCustomEnemyId: "ce-1" }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      expect(createEnemyInstanceMock.mock.calls[0][0].instanceNumber).toBe(4);
    });

    it("returns 500 when createEnemyInstance rejects", async () => {
      getGameMock.mockResolvedValue(gmGame);
      getCustomEnemyMock.mockResolvedValue({
        ...spawnTemplate,
        id: "ce-1",
        gameId: "g-1",
        name: "Goblin",
      });
      createEnemyInstanceMock.mockRejectedValue(new Error("insert failed"));
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ sourceCustomEnemyId: "ce-1" }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(500);
      expect((await response.json()).message).toBe(
        "Error creating enemy instance"
      );
    });

    it("returns 400 when request body is invalid JSON shape for zod", async () => {
      getGameMock.mockResolvedValue(gmGame);
      const { POST } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          { count: "not-a-number", sourceOfficialEnemyId: "oe-1" },
          "gm-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(400);
    });
  });

  describe("DELETE", () => {
    it("returns 401 when unauthenticated", async () => {
      const { DELETE } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        DELETE,
        makeUnauthedRequest({ instanceIds: ["ei-1"] }),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
      expect(deleteEnemyInstancesForGameMock).not.toHaveBeenCalled();
    });

    it("returns 400 when game id is empty", async () => {
      const { DELETE } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest({ instanceIds: ["ei-1"] }, "gm-1"),
        makeParams({ id: "" })
      );
      expect(response.status).toBe(400);
      expect(getGameMock).not.toHaveBeenCalled();
      expect(deleteEnemyInstancesForGameMock).not.toHaveBeenCalled();
    });

    it("returns 404 when game does not exist", async () => {
      getGameMock.mockResolvedValue(null);
      const { DELETE } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest({ instanceIds: ["ei-1"] }, "gm-1"),
        makeParams({ id: "g-missing" })
      );
      expect(response.status).toBe(404);
      expect(deleteEnemyInstancesForGameMock).not.toHaveBeenCalled();
    });

    it("returns 403 when caller is not game master", async () => {
      getGameMock.mockResolvedValue(gmGame);
      const { DELETE } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest({ instanceIds: ["ei-1", "ei-2"] }, "player-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
      expect(deleteEnemyInstancesForGameMock).not.toHaveBeenCalled();
    });

    it("returns 400 when instanceIds is empty", async () => {
      getGameMock.mockResolvedValue(gmGame);
      const { DELETE } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest({ instanceIds: [] }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(400);
      expect(deleteEnemyInstancesForGameMock).not.toHaveBeenCalled();
    });

    it("returns 400 when instanceIds is missing", async () => {
      getGameMock.mockResolvedValue(gmGame);
      const { DELETE } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest({}, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(400);
      expect(deleteEnemyInstancesForGameMock).not.toHaveBeenCalled();
    });

    it("returns 404 when any instance is missing so nothing is deleted", async () => {
      getGameMock.mockResolvedValue(gmGame);
      deleteEnemyInstancesForGameMock.mockResolvedValue({
        deleted: false,
        reason: "not_found",
      });
      const { DELETE } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest({ instanceIds: ["ei-1", "missing"] }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(404);
      expect(deleteEnemyInstancesForGameMock).toHaveBeenCalledWith("g-1", [
        "ei-1",
        "missing",
      ]);
    });

    it("returns 204 when GM deletes a set of instances", async () => {
      getGameMock.mockResolvedValue(gmGame);
      deleteEnemyInstancesForGameMock.mockResolvedValue({ deleted: true });
      const { DELETE } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest({ instanceIds: ["ei-1", "ei-2"] }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(204);
      expect(deleteEnemyInstancesForGameMock).toHaveBeenCalledWith("g-1", [
        "ei-1",
        "ei-2",
      ]);
    });

    it("returns 500 when deleteEnemyInstancesForGame rejects", async () => {
      getGameMock.mockResolvedValue(gmGame);
      deleteEnemyInstancesForGameMock.mockRejectedValue(new Error("db"));
      const { DELETE } =
        await import("@/app/api/games/[id]/enemy-instances/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest({ instanceIds: ["ei-1"] }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(500);
      expect((await response.json()).message).toBe(
        "Error deleting enemy instances"
      );
    });
  });
});
