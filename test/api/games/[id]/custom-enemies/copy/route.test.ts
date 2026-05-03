import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameMock = vi.fn();
const getCustomEnemyMock = vi.fn();
const createCustomEnemyMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
}));

vi.mock("@/app/lib/prisma/customEnemy", () => ({
  getCustomEnemy: getCustomEnemyMock,
  createCustomEnemy: createCustomEnemyMock,
}));

const sourceEnemy = {
  id: "ce-src",
  gameId: "g-src",
  name: "Copied Beast",
  description: "d",
  imageKey: null as string | null,
  health: 12,
  speed: 6,
  initiativeModifier: 0,
  numberOfReactions: 1,
  defenceMelee: 0,
  defenceRange: 0,
  defenceGrid: 0,
  attackMelee: 0,
  attackRange: 0,
  attackThrow: 0,
  attackGrid: 0,
  immunities: [] as string[],
  resistances: [] as string[],
  vulnerabilities: [] as string[],
  actions: [] as unknown[],
  additionalActions: [] as unknown[],
  notes: null as string | null,
};

describe("POST /api/games/[id]/custom-enemies/copy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/copy/route"
    );
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({}),
      makeParams({ id: "g-target" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 when target game id is empty", async () => {
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/copy/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceGameId: "g-src", sourceCustomEnemyId: "ce-src" },
        "gm-1"
      ),
      makeParams({ id: "" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when user id is empty string on session", async () => {
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/copy/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceGameId: "g-src", sourceCustomEnemyId: "ce-src" },
        ""
      ),
      makeParams({ id: "g-target" })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe("User ID not found");
  });

  it("returns 404 when target game not found", async () => {
    getGameMock.mockResolvedValueOnce(null);
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/copy/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceGameId: "g-src", sourceCustomEnemyId: "ce-src" },
        "gm-1"
      ),
      makeParams({ id: "g-missing" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 403 when caller is not target game master", async () => {
    getGameMock.mockResolvedValue({ id: "g-target", gameMaster: "gm-1" });
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/copy/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceGameId: "g-src", sourceCustomEnemyId: "ce-src" },
        "other-user"
      ),
      makeParams({ id: "g-target" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 400 when body fails zod validation", async () => {
    getGameMock.mockResolvedValue({ id: "g-target", gameMaster: "gm-1" });
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/copy/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ sourceGameId: "" }, "gm-1"),
      makeParams({ id: "g-target" })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toBe("Invalid request body");
  });

  it("returns 400 when source and target game are the same", async () => {
    getGameMock.mockResolvedValue({ id: "g-same", gameMaster: "gm-1" });
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/copy/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceGameId: "g-same", sourceCustomEnemyId: "ce-1" },
        "gm-1"
      ),
      makeParams({ id: "g-same" })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.message).toContain("Source and target");
  });

  it("returns 404 when source game not found", async () => {
    getGameMock
      .mockResolvedValueOnce({ id: "g-target", gameMaster: "gm-1" })
      .mockResolvedValueOnce(null);
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/copy/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceGameId: "g-src", sourceCustomEnemyId: "ce-src" },
        "gm-1"
      ),
      makeParams({ id: "g-target" })
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.message).toBe("Source game not found");
  });

  it("returns 403 when caller is not source game master", async () => {
    getGameMock
      .mockResolvedValueOnce({ id: "g-target", gameMaster: "gm-1" })
      .mockResolvedValueOnce({ id: "g-src", gameMaster: "someone-else" });
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/copy/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceGameId: "g-src", sourceCustomEnemyId: "ce-src" },
        "gm-1"
      ),
      makeParams({ id: "g-target" })
    );
    expect(response.status).toBe(403);
  });

  it("returns 404 when source enemy not in source game", async () => {
    getGameMock
      .mockResolvedValueOnce({ id: "g-target", gameMaster: "gm-1" })
      .mockResolvedValueOnce({ id: "g-src", gameMaster: "gm-1" });
    getCustomEnemyMock.mockResolvedValue({
      ...sourceEnemy,
      gameId: "wrong-game",
    });
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/copy/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceGameId: "g-src", sourceCustomEnemyId: "ce-src" },
        "gm-1"
      ),
      makeParams({ id: "g-target" })
    );
    expect(response.status).toBe(404);
  });

  it("returns 201 and creates enemy in target game on success", async () => {
    getGameMock
      .mockResolvedValueOnce({ id: "g-target", gameMaster: "gm-1" })
      .mockResolvedValueOnce({ id: "g-src", gameMaster: "gm-1" });
    getCustomEnemyMock.mockResolvedValue(sourceEnemy);
    createCustomEnemyMock.mockResolvedValue({
      id: "ce-new",
      gameId: "g-target",
      name: sourceEnemy.name,
    });
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/copy/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceGameId: "g-src", sourceCustomEnemyId: "ce-src" },
        "gm-1"
      ),
      makeParams({ id: "g-target" })
    );
    expect(response.status).toBe(201);
    expect(createCustomEnemyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: "g-target",
        name: "Copied Beast",
        health: 12,
      })
    );
    await expect(response.json()).resolves.toMatchObject({
      id: "ce-new",
      gameId: "g-target",
    });
  });

  it("returns 500 when createCustomEnemy throws", async () => {
    getGameMock
      .mockResolvedValueOnce({ id: "g-target", gameMaster: "gm-1" })
      .mockResolvedValueOnce({ id: "g-src", gameMaster: "gm-1" });
    getCustomEnemyMock.mockResolvedValue(sourceEnemy);
    createCustomEnemyMock.mockRejectedValue(new Error("db"));
    const { POST } = await import(
      "@/app/api/games/[id]/custom-enemies/copy/route"
    );
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { sourceGameId: "g-src", sourceCustomEnemyId: "ce-src" },
        "gm-1"
      ),
      makeParams({ id: "g-target" })
    );
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.message).toBe("Error copying custom enemy");
  });
});
