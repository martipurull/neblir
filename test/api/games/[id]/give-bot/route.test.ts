import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameMock = vi.fn();
const characterIsInGameMock = vi.fn();
const getBotMock = vi.fn();
const getCustomBotMock = vi.fn();
const getUniqueBotMock = vi.fn();
const createBotCharacterMock = vi.fn();
const uniqueBotHoldingExistsMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: (...args: unknown[]) => getGameMock(...args),
}));

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  characterIsInGame: (...args: unknown[]) => characterIsInGameMock(...args),
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
    getUniqueBot: (...args: unknown[]) => getUniqueBotMock(...args),
  };
});

vi.mock("@/app/lib/prisma/botCharacter", async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    createBotCharacter: (...args: unknown[]) => createBotCharacterMock(...args),
    uniqueBotHoldingExists: (...args: unknown[]) =>
      uniqueBotHoldingExistsMock(...args),
  };
});

const mule = {
  id: "ub-1",
  ownerUserId: "gm-1",
  gameId: "game-1",
  sourceType: "STANDALONE" as const,
  botId: null,
  nameOverride: "Mule",
  imageKeyOverride: null,
  descriptionOverride: null,
  confCostOverride: null,
  usageOverride: null,
  notesOverride: null,
  maxHpOverride: 8,
  speedOverride: 3,
  maxCarryWeightOverride: 40,
  processingPowerOverride: 2,
  batteryCapacityOverride: 6,
  maxCargoWeightKgOverride: null,
  maxInstalledItemsOverride: null,
  templateName: null,
};

describe("POST /api/games/[id]/give-bot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "gm-1" });
    characterIsInGameMock.mockResolvedValue(true);
    getUniqueBotMock.mockResolvedValue(mule);
    uniqueBotHoldingExistsMock.mockResolvedValue(false);
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
    const { POST } = await import("@/app/api/games/[id]/give-bot/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({
        characterId: "char-1",
        sourceType: "UNIQUE",
        botId: "ub-1",
      }),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when the caller is not the game master", async () => {
    const { POST } = await import("@/app/api/games/[id]/give-bot/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "char-1", sourceType: "UNIQUE", botId: "ub-1" },
        "player-1"
      ),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(403);
    expect(createBotCharacterMock).not.toHaveBeenCalled();
  });

  it("gives a unique bot the game master minted", async () => {
    const { POST } = await import("@/app/api/games/[id]/give-bot/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "char-1", sourceType: "UNIQUE", botId: "ub-1" },
        "gm-1"
      ),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.displayName).toBe("Mule");
    expect(body.currentHp).toBe(8);
    expect(body.speed).toBe(3);
    expect(body.effectiveSpeed).toBe(3);
    expect(body.maxCarryWeight).toBe(40);
    expect(body.attributes.processingPower).toMatchObject({
      base: 2,
      effective: 2,
      signedUpgrade: null,
    });
    expect(body.battery).toMatchObject({ base: 6, used: 0, remaining: 6 });
    expect(body.mayRoll).toBe(true);
    expect(createBotCharacterMock).toHaveBeenCalledWith(
      expect.objectContaining({
        characterId: "char-1",
        botId: "ub-1",
        sourceType: "UNIQUE",
        currentHp: 8,
        reactionsRemaining: 2,
      })
    );
  });

  it("refuses somebody else's unique bot", async () => {
    getUniqueBotMock.mockResolvedValue({ ...mule, ownerUserId: "player-1" });
    const { POST } = await import("@/app/api/games/[id]/give-bot/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "char-1", sourceType: "UNIQUE", botId: "ub-1" },
        "gm-1"
      ),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      message: "You can only give a unique bot you minted.",
    });
    expect(createBotCharacterMock).not.toHaveBeenCalled();
  });

  it("refuses a second holding of one unique bot", async () => {
    uniqueBotHoldingExistsMock.mockResolvedValue(true);
    const { POST } = await import("@/app/api/games/[id]/give-bot/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "char-2", sourceType: "UNIQUE", botId: "ub-1" },
        "gm-1"
      ),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      message: "This unique bot already has a holding.",
    });
    expect(createBotCharacterMock).not.toHaveBeenCalled();
  });

  it("gives a custom bot that belongs to the game", async () => {
    getCustomBotMock.mockResolvedValue({
      id: "custom-1",
      gameId: "game-1",
      name: "Hauler",
      description: null,
      confCost: null,
      usage: null,
      notes: null,
      maxHp: 6,
      maxCargoWeightKg: null,
      maxInstalledItems: null,
      speed: 5,
      maxCarryWeight: 20,
      processingPower: 1,
      batteryCapacity: 4,
    });
    const { POST } = await import("@/app/api/games/[id]/give-bot/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "char-1", sourceType: "CUSTOM", botId: "custom-1" },
        "gm-1"
      ),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.displayName).toBe("Hauler");
    expect(body.currentHp).toBe(6);
    expect(body.speed).toBe(5);
    expect(body.effectiveSpeed).toBe(5);
    expect(body.maxCarryWeight).toBe(20);
    expect(body.attributes.processingPower).toMatchObject({
      base: 1,
      effective: 1,
      signedUpgrade: null,
    });
    expect(body.battery).toMatchObject({ base: 4, used: 0, remaining: 4 });
  });

  it("refuses a custom bot from another game", async () => {
    getCustomBotMock.mockResolvedValue({
      id: "custom-1",
      gameId: "other-game",
      name: "Hauler",
      maxHp: 6,
    });
    const { POST } = await import("@/app/api/games/[id]/give-bot/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "char-1", sourceType: "CUSTOM", botId: "custom-1" },
        "gm-1"
      ),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(403);
    expect(createBotCharacterMock).not.toHaveBeenCalled();
  });

  it("gives an Official bot at its max HP", async () => {
    getBotMock.mockResolvedValue({
      id: "bot-1",
      name: "Loader",
      maxHp: 12,
      accessType: "PLAYER",
      speed: 4,
      maxCarryWeight: 30,
      processingPower: -1,
      batteryCapacity: 8,
    });
    const { POST } = await import("@/app/api/games/[id]/give-bot/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { characterId: "char-1", sourceType: "OFFICIAL", botId: "bot-1" },
        "gm-1"
      ),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.displayName).toBe("Loader");
    expect(body.currentHp).toBe(12);
    expect(body.speed).toBe(4);
    expect(body.effectiveSpeed).toBe(4);
    expect(body.maxCarryWeight).toBe(30);
    expect(body.attributes.processingPower).toMatchObject({
      base: -1,
      effective: -1,
      signedUpgrade: null,
    });
    expect(body.battery).toMatchObject({ base: 8, used: 0, remaining: 8 });
  });
});
