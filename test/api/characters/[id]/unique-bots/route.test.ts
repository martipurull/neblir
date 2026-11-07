import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const characterBelongsToUserMock = vi.fn();
const getCharacterMock = vi.fn();
const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getBotMock = vi.fn();
const getCustomBotMock = vi.fn();
const createUniqueBotMock = vi.fn();
const createBotCharacterMock = vi.fn();

vi.mock("@/app/lib/prisma/characterUser", () => ({
  characterBelongsToUser: (...args: unknown[]) =>
    characterBelongsToUserMock(...args),
}));

vi.mock("@/app/lib/prisma/character", () => ({
  getCharacter: (...args: unknown[]) => getCharacterMock(...args),
}));

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: (...args: unknown[]) => getGameMock(...args),
  userIsInGame: (...args: unknown[]) => userIsInGameMock(...args),
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

vi.mock("@/app/lib/prisma/botCharacter", async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    createBotCharacter: (...args: unknown[]) => createBotCharacterMock(...args),
  };
});

const standaloneBody = {
  gameId: "g-1",
  sourceType: "STANDALONE" as const,
  nameOverride: "Mule",
  maxHpOverride: 8,
};

describe("POST /api/characters/[id]/unique-bots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCharacterMock.mockResolvedValue({
      id: "char-1",
      games: [{ game: { id: "g-1", name: "Table" } }],
    });
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    characterBelongsToUserMock.mockResolvedValue(true);
    userIsInGameMock.mockResolvedValue(true);
    createUniqueBotMock.mockImplementation(
      async (data: { gameId: string }) => ({
        id: "ub-1",
        templateName: null,
        ...data,
      })
    );
    createBotCharacterMock.mockImplementation(
      async (data: {
        characterId: string;
        botId: string;
        currentHp: number;
        sourceType?: string;
      }) => ({
        id: "hold-1",
        characterId: data.characterId,
        botId: data.botId,
        sourceType: data.sourceType ?? "OFFICIAL",
        customName: null,
        currentHp: data.currentHp,
        maxHpBonus: 0,
        notes: null,
      })
    );
  });

  it("returns 401 when unauthenticated", async () => {
    const { POST } =
      await import("@/app/api/characters/[id]/unique-bots/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest(standaloneBody),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(401);
  });

  it("refuses a play-grant grantee who is not the owner", async () => {
    characterBelongsToUserMock.mockResolvedValue(false);
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    const { POST } =
      await import("@/app/api/characters/[id]/unique-bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(standaloneBody, "grantee"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
    expect(createUniqueBotMock).not.toHaveBeenCalled();
    expect(createBotCharacterMock).not.toHaveBeenCalled();
  });

  it("lets an owner mint a standalone unique bot onto their character", async () => {
    const { POST } =
      await import("@/app/api/characters/[id]/unique-bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(standaloneBody, "owner-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.displayName).toBe("Mule");
    expect(body.currentHp).toBe(8);
    expect(body.effectiveMaxHp).toBe(8);
    expect(createUniqueBotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: "owner-1",
        sourceType: "STANDALONE",
        nameOverride: "Mule",
      })
    );
    expect(createBotCharacterMock).toHaveBeenCalledWith(
      expect.objectContaining({
        characterId: "char-1",
        botId: "ub-1",
        sourceType: "UNIQUE",
        currentHp: 8,
      })
    );
  });

  it("shows the name override instead of the Official template name", async () => {
    getBotMock.mockResolvedValue({
      id: "bot-1",
      name: "Loader",
      maxHp: 12,
      description: "Hauler",
      imageKey: "bots-loader.png",
    });
    const { POST } =
      await import("@/app/api/characters/[id]/unique-bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          gameId: "g-1",
          sourceType: "OFFICIAL",
          botId: "bot-1",
          nameOverride: "Scout",
          maxHpOverride: 20,
        },
        "owner-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.displayName).toBe("Scout");
    expect(body.effectiveMaxHp).toBe(20);
    expect(body.bot).toMatchObject({
      name: "Scout",
      imageKey: "bots-loader.png",
    });
  });

  it("shows the Official template name when there is no override", async () => {
    getBotMock.mockResolvedValue({
      id: "bot-1",
      name: "Loader",
      maxHp: 12,
    });
    const { POST } =
      await import("@/app/api/characters/[id]/unique-bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { gameId: "g-1", sourceType: "OFFICIAL", botId: "bot-1" },
        "owner-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.displayName).toBe("Loader");
    expect(body.effectiveMaxHp).toBe(12);
  });

  it("refuses a closed Custom bot for a character owner", async () => {
    getCustomBotMock.mockResolvedValue({
      id: "cb-1",
      gameId: "g-1",
      name: "Porter",
      maxHp: 9,
      membersCanModify: false,
    });
    const { POST } =
      await import("@/app/api/characters/[id]/unique-bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { gameId: "g-1", sourceType: "CUSTOM", botId: "cb-1" },
        "owner-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(403);
    expect(createUniqueBotMock).not.toHaveBeenCalled();
  });

  it("lets an owner mint from a Custom bot members may modify", async () => {
    getCustomBotMock.mockResolvedValue({
      id: "cb-1",
      gameId: "g-1",
      name: "Porter",
      maxHp: 9,
      membersCanModify: true,
    });
    const { POST } =
      await import("@/app/api/characters/[id]/unique-bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { gameId: "g-1", sourceType: "CUSTOM", botId: "cb-1" },
        "owner-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.displayName).toBe("Porter");
    expect(body.currentHp).toBe(9);
  });

  it("lets the game master mint from a closed Custom bot", async () => {
    characterBelongsToUserMock.mockResolvedValue(false);
    getCustomBotMock.mockResolvedValue({
      id: "cb-1",
      gameId: "g-1",
      name: "Porter",
      maxHp: 9,
      membersCanModify: false,
    });
    const { POST } =
      await import("@/app/api/characters/[id]/unique-bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { gameId: "g-1", sourceType: "CUSTOM", botId: "cb-1" },
        "gm-1"
      ),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(201);
    expect(createUniqueBotMock).toHaveBeenCalledWith(
      expect.objectContaining({ ownerUserId: "gm-1", sourceType: "CUSTOM" })
    );
  });
});
