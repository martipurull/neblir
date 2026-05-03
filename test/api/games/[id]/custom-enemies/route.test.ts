import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getCustomEnemiesByGameMock = vi.fn();
const createCustomEnemyMock = vi.fn();
const omitMock = vi.fn();
const safeParseMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/customEnemy", () => ({
  getCustomEnemiesByGame: getCustomEnemiesByGameMock,
  createCustomEnemy: createCustomEnemyMock,
}));

vi.mock("@/app/lib/types/enemy", () => ({
  customEnemyCreateSchema: {
    omit: omitMock,
  },
}));

describe("/api/games/[id]/custom-enemies route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    omitMock.mockReturnValue({ safeParse: safeParseMock });
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } = await import("@/app/api/games/[id]/custom-enemies/route");
      const response = await invokeRoute(
        GET,
        makeUnauthedRequest(),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 when game id is empty", async () => {
      const { GET } = await import("@/app/api/games/[id]/custom-enemies/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "" })
      );
      expect(response.status).toBe(400);
      expect(getGameMock).not.toHaveBeenCalled();
    });

    it("returns 404 when game not found", async () => {
      getGameMock.mockResolvedValue(null);
      const { GET } = await import("@/app/api/games/[id]/custom-enemies/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "g-missing" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 403 when user is not GM and not in game", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      userIsInGameMock.mockResolvedValue(false);
      const { GET } = await import("@/app/api/games/[id]/custom-enemies/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "stranger"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
      expect(getCustomEnemiesByGameMock).not.toHaveBeenCalled();
    });

    it("returns 200 when user is game master", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      userIsInGameMock.mockResolvedValue(false);
      getCustomEnemiesByGameMock.mockResolvedValue([{ id: "ce-1" }]);
      const { GET } = await import("@/app/api/games/[id]/custom-enemies/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([{ id: "ce-1" }]);
      expect(getCustomEnemiesByGameMock).toHaveBeenCalledWith("g-1");
    });

    it("returns 200 when user is a member", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      userIsInGameMock.mockResolvedValue(true);
      getCustomEnemiesByGameMock.mockResolvedValue([]);
      const { GET } = await import("@/app/api/games/[id]/custom-enemies/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "player-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([]);
    });

    it("returns 500 when getCustomEnemiesByGame throws", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      userIsInGameMock.mockResolvedValue(true);
      getCustomEnemiesByGameMock.mockRejectedValue(new Error("db error"));
      const { GET } = await import("@/app/api/games/[id]/custom-enemies/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "player-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.message).toBe("Error fetching custom enemies");
    });
  });

  describe("POST", () => {
    it("returns 401 when unauthenticated", async () => {
      const { POST } = await import(
        "@/app/api/games/[id]/custom-enemies/route"
      );
      const response = await invokeRoute(
        POST,
        makeUnauthedRequest({}),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 when game id is empty", async () => {
      const { POST } = await import(
        "@/app/api/games/[id]/custom-enemies/route"
      );
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ name: "X" }, "gm-1"),
        makeParams({ id: "" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 404 when game not found", async () => {
      getGameMock.mockResolvedValue(null);
      const { POST } = await import(
        "@/app/api/games/[id]/custom-enemies/route"
      );
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ name: "X" }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 403 when caller is not the game master", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      const { POST } = await import(
        "@/app/api/games/[id]/custom-enemies/route"
      );
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ name: "X" }, "player-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
      expect(safeParseMock).not.toHaveBeenCalled();
    });

    it("returns 400 when body fails schema validation", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      safeParseMock.mockReturnValue({
        error: { issues: [{ message: "invalid field" }] },
        data: undefined,
      });
      const { POST } = await import(
        "@/app/api/games/[id]/custom-enemies/route"
      );
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ bad: true }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(400);
      expect(createCustomEnemyMock).not.toHaveBeenCalled();
    });

    it("returns 201 on success", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      const parsed = {
        name: "Bandit",
        health: 8,
        speed: 5,
        initiativeModifier: 1,
        numberOfReactions: 1,
      };
      safeParseMock.mockReturnValue({ data: parsed, error: undefined });
      createCustomEnemyMock.mockResolvedValue({ id: "ce-1", ...parsed });
      const { POST } = await import(
        "@/app/api/games/[id]/custom-enemies/route"
      );
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(parsed, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      expect(createCustomEnemyMock).toHaveBeenCalledWith({
        ...parsed,
        gameId: "g-1",
      });
    });

    it("returns 500 when createCustomEnemy throws", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      safeParseMock.mockReturnValue({
        data: {
          name: "Bandit",
          health: 8,
          speed: 5,
          initiativeModifier: 1,
          numberOfReactions: 1,
        },
        error: undefined,
      });
      createCustomEnemyMock.mockRejectedValue(new Error("write failed"));
      const { POST } = await import(
        "@/app/api/games/[id]/custom-enemies/route"
      );
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ name: "Bandit" }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.message).toBe("Error creating custom enemy");
    });
  });
});
