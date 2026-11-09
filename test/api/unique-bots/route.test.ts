import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const getGameMock = vi.fn();
const getBotMock = vi.fn();
const getCustomBotMock = vi.fn();
const createUniqueBotMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: (...args: unknown[]) => getGameMock(...args),
}));

vi.mock("@/app/lib/prisma/bot", () => ({
  getBot: (...args: unknown[]) => getBotMock(...args),
}));

vi.mock("@/app/lib/prisma/customBot", () => ({
  getCustomBot: (...args: unknown[]) => getCustomBotMock(...args),
}));

vi.mock("@/app/lib/prisma/uniqueBot", async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    createUniqueBot: (...args: unknown[]) => createUniqueBotMock(...args),
  };
});

describe("POST /api/unique-bots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "gm-1" });
    createUniqueBotMock.mockImplementation(
      async (data: { gameId: string }) => ({
        id: "ub-1",
        templateName: null,
        ...data,
      })
    );
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/unique-bots/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({
        gameId: "game-1",
        sourceType: "STANDALONE",
        nameOverride: "Mule",
        maxHpOverride: 8,
      })
    );
    expect(response.status).toBe(401);
    expect(createUniqueBotMock).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller is not the game master", async () => {
    const { POST } = await import("@/app/api/unique-bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          gameId: "game-1",
          sourceType: "STANDALONE",
          nameOverride: "Mule",
          maxHpOverride: 8,
        },
        "player-1"
      )
    );
    expect(response.status).toBe(403);
    expect(createUniqueBotMock).not.toHaveBeenCalled();
  });

  it("mints a standalone unique bot with no character", async () => {
    const { POST } = await import("@/app/api/unique-bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          gameId: "game-1",
          sourceType: "STANDALONE",
          nameOverride: "Mule",
          maxHpOverride: 8,
        },
        "gm-1"
      )
    );
    expect(response.status).toBe(201);
    expect(createUniqueBotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: "gm-1",
        gameId: "game-1",
        sourceType: "STANDALONE",
        botId: null,
        nameOverride: "Mule",
        maxHpOverride: 8,
      })
    );
    await expect(response.json()).resolves.toEqual({ id: "ub-1" });
    expect(getBotMock).not.toHaveBeenCalled();
    expect(getCustomBotMock).not.toHaveBeenCalled();
  });

  it("mints a unique bot from an Official bot", async () => {
    getBotMock.mockResolvedValue({ id: "bot-1", name: "Loader", maxHp: 12 });
    const { POST } = await import("@/app/api/unique-bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          gameId: "game-1",
          sourceType: "OFFICIAL",
          botId: "bot-1",
          nameOverride: "Scout",
        },
        "gm-1"
      )
    );
    expect(response.status).toBe(201);
    expect(createUniqueBotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: "gm-1",
        sourceType: "OFFICIAL",
        botId: "bot-1",
        nameOverride: "Scout",
      })
    );
  });

  it("mints a unique bot from this game's Custom bot", async () => {
    getCustomBotMock.mockResolvedValue({
      id: "cb-1",
      gameId: "game-1",
      name: "Porter",
      maxHp: 9,
      membersCanModify: false,
    });
    const { POST } = await import("@/app/api/unique-bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          gameId: "game-1",
          sourceType: "CUSTOM",
          botId: "cb-1",
        },
        "gm-1"
      )
    );
    expect(response.status).toBe(201);
    expect(createUniqueBotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "CUSTOM",
        botId: "cb-1",
        gameId: "game-1",
      })
    );
  });

  it("refuses a Custom bot from another game", async () => {
    getCustomBotMock.mockResolvedValue({
      id: "cb-1",
      gameId: "game-2",
      name: "Porter",
      maxHp: 9,
    });
    const { POST } = await import("@/app/api/unique-bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          gameId: "game-1",
          sourceType: "CUSTOM",
          botId: "cb-1",
        },
        "gm-1"
      )
    );
    expect(response.status).toBe(400);
    expect(createUniqueBotMock).not.toHaveBeenCalled();
  });
});
