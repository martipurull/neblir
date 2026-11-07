import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const playControlMock = vi.fn();
const characterIsInGameMock = vi.fn();
const getBotMock = vi.fn();
const getBotsByIdsMock = vi.fn();
const getCustomBotMock = vi.fn();
const getCustomBotsByIdsMock = vi.fn();
const createBotCharacterMock = vi.fn();
const listBotCharacterRowsMock = vi.fn();
const uniqueBotHoldingExistsMock = vi.fn();
const getUniqueBotRowMock = vi.fn();
const getResolvedUniqueBotsByIdsMock = vi.fn();

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  userHasPlayControl: (...args: unknown[]) => playControlMock(...args),
  characterIsInGame: (...args: unknown[]) => characterIsInGameMock(...args),
}));

vi.mock("@/app/lib/prisma/bot", () => ({
  getBot: (...args: unknown[]) => getBotMock(...args),
  getBotsByIds: (...args: unknown[]) => getBotsByIdsMock(...args),
}));

vi.mock("@/app/lib/prisma/customBot", () => ({
  getCustomBot: (...args: unknown[]) => getCustomBotMock(...args),
  getCustomBotsByIds: (...args: unknown[]) => getCustomBotsByIdsMock(...args),
}));

vi.mock("@/app/lib/prisma/botPlacement", () => ({
  placementsForHoldings: async () => new Map(),
  placementsByHolding: async () => new Map(),
  botHoldingHasPlacements: async () => false,
}));

vi.mock("@/app/lib/prisma/uniqueBot", async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    getUniqueBotRow: (...args: unknown[]) => getUniqueBotRowMock(...args),
    getResolvedUniqueBotsByIds: (...args: unknown[]) =>
      getResolvedUniqueBotsByIdsMock(...args),
  };
});

vi.mock("@/app/lib/prisma/botCharacter", async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    listBotCharacterRows: (...args: unknown[]) =>
      listBotCharacterRowsMock(...args),
    createBotCharacter: (...args: unknown[]) => createBotCharacterMock(...args),
    uniqueBotHoldingExists: (...args: unknown[]) =>
      uniqueBotHoldingExistsMock(...args),
  };
});

const loader = {
  id: "bot-1",
  accessType: "PLAYER" as const,
  name: "Loader",
  imageKey: null,
  description: "A hauler frame.",
  confCost: 40,
  usage: null,
  notes: null,
  maxHp: 12,
};

const damageProfile = [
  { damageType: "GRID", mark: "VULNERABLE" },
  { damageType: "ICE", mark: "RESISTANT" },
  { damageType: "FIRE", mark: "RESISTANT" },
  { damageType: "BLUDGEONING", mark: "RESISTANT" },
  { damageType: "BULLET", mark: "RESISTANT" },
  { damageType: "BLADE", mark: "RESISTANT" },
  { damageType: "NERVE", mark: "IMMUNE" },
  { damageType: "POISON", mark: "IMMUNE" },
  { damageType: "SIIKE", mark: "UNMARKED" },
  { damageType: "ACID", mark: "UNMARKED" },
  { damageType: "ELECTRICITY", mark: "UNMARKED" },
  { damageType: "OTHER", mark: "UNMARKED" },
];

describe("/api/characters/[id]/bots handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    playControlMock.mockResolvedValue(true);
    characterIsInGameMock.mockResolvedValue(true);
    uniqueBotHoldingExistsMock.mockResolvedValue(false);
    getBotMock.mockResolvedValue(loader);
    createBotCharacterMock.mockImplementation(
      async (data: {
        characterId: string;
        botId: string;
        currentHp: number;
        maxHpBonus?: number;
      }) => ({
        id: `hold-${createBotCharacterMock.mock.calls.length}`,
        characterId: data.characterId,
        botId: data.botId,
        customName: null,
        currentHp: data.currentHp,
        maxHpBonus: data.maxHpBonus ?? 0,
        notes: null,
      })
    );
  });

  it("POST returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/characters/[id]/bots/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({ botId: "bot-1" }),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(401);
    expect(createBotCharacterMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 when the body has no bot", async () => {
    const { POST } = await import("@/app/api/characters/[id]/bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({}, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(400);
    expect(createBotCharacterMock).not.toHaveBeenCalled();
  });

  it("POST returns 404 when the Official bot does not exist", async () => {
    getBotMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/characters/[id]/bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ botId: "missing" }, "user-1"),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(404);
    expect(createBotCharacterMock).not.toHaveBeenCalled();
  });

  it("POST returns 403 when the user lacks play control", async () => {
    playControlMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ botId: "bot-1" }, "user-1"),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(403);
    expect(createBotCharacterMock).not.toHaveBeenCalled();
  });

  it("POST returns 201 with an Operational holding at max HP and no max HP bonus", async () => {
    const { POST } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ botId: "bot-1" }, "user-1"),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(201);
    expect(createBotCharacterMock).toHaveBeenCalledWith({
      characterId: "char-1",
      botId: "bot-1",
      currentHp: 12,
      maxHpBonus: 0,
    });
    const body = await response.json();
    expect(body).toMatchObject({
      displayName: "Loader",
      currentHp: 12,
      maxHpBonus: 0,
      effectiveMaxHp: 12,
      condition: "OPERATIONAL",
      customName: null,
    });
    expect(body.damageProfile).toEqual(damageProfile);
  });

  it("POST lets one character hold two of the same Official bot", async () => {
    const { POST } = await import("@/app/api/characters/[id]/bots/route");
    const request = () =>
      invokeRoute(
        POST,
        makeAuthedRequest({ botId: "bot-1" }, "user-1"),
        makeParams({ id: "char-1" })
      );

    const first = await request();
    const second = await request();

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(createBotCharacterMock).toHaveBeenCalledTimes(2);
    const firstBody = await first.json();
    const secondBody = await second.json();
    expect(firstBody.id).not.toBe(secondBody.id);
    expect(secondBody.displayName).toBe("Loader");
  });

  it("POST holds a GM-only Official bot and returns it for the player", async () => {
    getBotMock.mockResolvedValue({
      ...loader,
      accessType: "GAME_MASTER",
      name: "Black Frame",
    });
    const { POST } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ botId: "bot-1" }, "user-1"),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.displayName).toBe("Black Frame");
    expect(body.bot).toMatchObject({
      accessType: "GAME_MASTER",
      name: "Black Frame",
    });
  });

  it("GET returns a GM-only holding to someone with play control", async () => {
    listBotCharacterRowsMock.mockResolvedValue([
      {
        id: "hold-1",
        characterId: "char-1",
        botId: "bot-1",
        customName: null,
        currentHp: 12,
        maxHpBonus: 0,
        notes: null,
      },
    ]);
    getBotsByIdsMock.mockResolvedValue([
      { ...loader, accessType: "GAME_MASTER", name: "Black Frame" },
    ]);
    const { GET } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([
      expect.objectContaining({
        id: "hold-1",
        displayName: "Black Frame",
        condition: "OPERATIONAL",
        bot: expect.objectContaining({ accessType: "GAME_MASTER" }),
      }),
    ]);
  });

  it("POST returns 403 when the user lacks play control of a Custom bot", async () => {
    playControlMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { botId: "cb-1", sourceType: "CUSTOM", gameId: "g-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(403);
    expect(createBotCharacterMock).not.toHaveBeenCalled();
    expect(getCustomBotMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 when a Custom bot is added without a game", async () => {
    const { POST } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ botId: "cb-1", sourceType: "CUSTOM" }, "user-1"),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      details: expect.stringContaining("Game is required"),
    });
    expect(createBotCharacterMock).not.toHaveBeenCalled();
    expect(getCustomBotMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 when the character is not in the supplied game", async () => {
    characterIsInGameMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { botId: "cb-1", sourceType: "CUSTOM", gameId: "g-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      message: "Character is not linked to the supplied game.",
    });
    expect(createBotCharacterMock).not.toHaveBeenCalled();
    expect(getCustomBotMock).not.toHaveBeenCalled();
  });

  it("POST returns 404 when the Custom bot does not exist", async () => {
    getCustomBotMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { botId: "cb-1", sourceType: "CUSTOM", gameId: "g-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      message: "Custom bot not found",
    });
    expect(createBotCharacterMock).not.toHaveBeenCalled();
  });

  it("POST returns 403 when the Custom bot belongs to another game", async () => {
    getCustomBotMock.mockResolvedValue({
      id: "cb-1",
      gameId: "g-2",
      name: "Porter",
      description: null,
      confCost: null,
      usage: null,
      notes: null,
      maxHp: 9,
      membersCanModify: false,
    });
    const { POST } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { botId: "cb-1", sourceType: "CUSTOM", gameId: "g-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(403);
    expect(createBotCharacterMock).not.toHaveBeenCalled();
  });

  it("POST adds a holding of this game's Custom bot at its max HP", async () => {
    getCustomBotMock.mockResolvedValue({
      id: "cb-1",
      gameId: "g-1",
      name: "Porter",
      description: null,
      confCost: null,
      usage: null,
      notes: null,
      maxHp: 9,
      membersCanModify: false,
    });
    const { POST } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { botId: "cb-1", sourceType: "CUSTOM", gameId: "g-1" },
        "user-1"
      ),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(201);
    expect(createBotCharacterMock).toHaveBeenCalledWith({
      characterId: "char-1",
      botId: "cb-1",
      sourceType: "CUSTOM",
      currentHp: 9,
      maxHpBonus: 0,
    });
    const body = await response.json();
    expect(body).toMatchObject({
      displayName: "Porter",
      currentHp: 9,
      maxHpBonus: 0,
      effectiveMaxHp: 9,
      condition: "OPERATIONAL",
    });
    expect(body.bot).toEqual({
      id: "cb-1",
      name: "Porter",
      description: null,
      confCost: null,
      usage: null,
      notes: null,
      maxHp: 9,
    });
    expect(body.damageProfile).toEqual(damageProfile);
  });

  it("GET shows the Custom bot's current name and max HP on every holding", async () => {
    listBotCharacterRowsMock.mockResolvedValue([
      {
        id: "hold-1",
        characterId: "char-1",
        botId: "cb-1",
        sourceType: "CUSTOM",
        customName: null,
        currentHp: 9,
        maxHpBonus: 2,
        notes: null,
      },
      {
        id: "hold-2",
        characterId: "char-1",
        botId: "cb-1",
        sourceType: "CUSTOM",
        customName: "Left arm",
        currentHp: 4,
        maxHpBonus: 0,
        notes: null,
      },
    ]);
    getCustomBotsByIdsMock.mockResolvedValue([
      {
        id: "cb-1",
        gameId: "g-1",
        name: "Hauler",
        description: "A revised frame.",
        confCost: null,
        usage: null,
        notes: null,
        maxHp: 20,
        membersCanModify: false,
      },
    ]);
    const { GET } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([
      expect.objectContaining({
        id: "hold-1",
        displayName: "Hauler",
        currentHp: 9,
        effectiveMaxHp: 22,
        bot: expect.objectContaining({ name: "Hauler", maxHp: 20 }),
      }),
      expect.objectContaining({
        id: "hold-2",
        displayName: "Left arm",
        currentHp: 4,
        effectiveMaxHp: 20,
        bot: expect.objectContaining({ name: "Hauler", maxHp: 20 }),
      }),
    ]);
  });

  it("POST refuses a unique bot minted by somebody else", async () => {
    getUniqueBotRowMock.mockResolvedValue({
      id: "ub-1",
      ownerUserId: "minter",
      gameId: "g-1",
      sourceType: "STANDALONE",
      botId: null,
      nameOverride: "Mule",
      maxHpOverride: 8,
    });
    const { POST } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ botId: "ub-1", sourceType: "UNIQUE" }, "grantee"),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      message: "You can only add a unique bot you minted.",
    });
    expect(createBotCharacterMock).not.toHaveBeenCalled();
  });

  it("POST holds a minted unique bot again and shows its own name", async () => {
    getUniqueBotRowMock.mockResolvedValue({
      id: "ub-1",
      ownerUserId: "user-1",
      gameId: "g-1",
      sourceType: "STANDALONE",
      botId: null,
      nameOverride: "Mule",
      imageKeyOverride: null,
      descriptionOverride: null,
      confCostOverride: null,
      usageOverride: null,
      notesOverride: null,
      maxHpOverride: 8,
      maxCargoWeightKgOverride: null,
      maxInstalledItemsOverride: null,
    });
    const { POST } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ botId: "ub-1", sourceType: "UNIQUE" }, "user-1"),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(201);
    expect(createBotCharacterMock).toHaveBeenCalledWith({
      characterId: "char-1",
      botId: "ub-1",
      sourceType: "UNIQUE",
      currentHp: 8,
      maxHpBonus: 0,
    });
    const body = await response.json();
    expect(body.displayName).toBe("Mule");
    expect(body.effectiveMaxHp).toBe(8);
  });

  it("POST uses a unique bot's speed, carry, height, and weight overrides", async () => {
    getUniqueBotRowMock.mockResolvedValue({
      id: "ub-1",
      ownerUserId: "user-1",
      gameId: "g-1",
      sourceType: "OFFICIAL",
      botId: "bot-1",
      nameOverride: null,
      maxHpOverride: null,
      speedOverride: 12,
      maxCarryWeightOverride: 30,
      heightMetresOverride: 1.8,
      weightOverride: 400,
    });
    getBotMock.mockResolvedValue({
      ...loader,
      speed: 4,
      maxCarryWeight: 10,
      heightMetres: 1,
      weight: 20,
    });
    const { POST } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ botId: "ub-1", sourceType: "UNIQUE" }, "user-1"),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.speed).toBe(12);
    expect(body.effectiveSpeed).toBe(12);
    expect(body.speedStrikethrough).toBe(false);
    expect(body.maxCarryWeight).toBe(30);
    expect(body.effectiveMaxCarryWeight).toBe(30);
    expect(body.heightMetres).toBe(1.8);
    expect(body.weight).toBe(400);
  });

  it("POST refuses a second holding of one unique bot", async () => {
    getUniqueBotRowMock.mockResolvedValue({
      id: "ub-1",
      ownerUserId: "user-1",
      gameId: "g-1",
      sourceType: "STANDALONE",
      botId: null,
      nameOverride: "Mule",
      maxHpOverride: 8,
    });
    uniqueBotHoldingExistsMock.mockResolvedValue(true);
    const { POST } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ botId: "ub-1", sourceType: "UNIQUE" }, "user-1"),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      message: "This unique bot already has a holding.",
    });
    expect(createBotCharacterMock).not.toHaveBeenCalled();
  });

  it("GET shows the nickname, otherwise the unique name", async () => {
    listBotCharacterRowsMock.mockResolvedValue([
      {
        id: "hold-nick",
        characterId: "char-1",
        botId: "ub-1",
        sourceType: "UNIQUE",
        customName: "Sparky",
        currentHp: 8,
        maxHpBonus: 0,
        notes: null,
      },
      {
        id: "hold-own",
        characterId: "char-1",
        botId: "ub-1",
        sourceType: "UNIQUE",
        customName: null,
        currentHp: 8,
        maxHpBonus: 0,
        notes: null,
      },
    ]);
    getResolvedUniqueBotsByIdsMock.mockResolvedValue([
      {
        id: "ub-1",
        name: "Scout",
        maxHp: 14,
        description: null,
        confCost: null,
        usage: null,
        notes: null,
        imageKey: "unique_bots-scout.png",
        gameId: "g-1",
        ownerUserId: "user-1",
      },
    ]);
    const { GET } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([
      expect.objectContaining({
        id: "hold-nick",
        displayName: "Sparky",
        effectiveMaxHp: 14,
        uniqueOwnerUserId: "user-1",
        gameId: "g-1",
        bot: expect.objectContaining({
          name: "Scout",
          imageKey: "unique_bots-scout.png",
        }),
      }),
      expect.objectContaining({
        id: "hold-own",
        displayName: "Scout",
        effectiveMaxHp: 14,
      }),
    ]);
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/characters/[id]/bots/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "char-1" })
    );
    expect(response.status).toBe(401);
  });

  it("POST starts a holding at max HP with upgrades, battery used, and the flag clear", async () => {
    const { POST } = await import("@/app/api/characters/[id]/bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ botId: "bot-1" }, "user-1"),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      currentHp: 12,
      effectiveMaxHp: 12,
      condition: "OPERATIONAL",
      isBeyondRepair: false,
      mayRoll: true,
      rollBlockedReason: null,
      attributes: {
        processingPower: {
          base: 0,
          upgrade: 0,
          effective: 0,
          signedUpgrade: null,
        },
        physicalPower: { upgrade: 0, signedUpgrade: null },
        finesseCapacity: { upgrade: 0, signedUpgrade: null },
        gridProtection: { upgrade: 0, signedUpgrade: null },
      },
      battery: {
        base: 1,
        upgrade: 0,
        used: 0,
        remaining: 1,
        signedUpgrade: null,
      },
    });
  });

  it("POST uses a Unique bot's overridden bases", async () => {
    getUniqueBotRowMock.mockResolvedValue({
      id: "ub-1",
      ownerUserId: "user-1",
      gameId: "g-1",
      sourceType: "OFFICIAL",
      botId: "bot-1",
      nameOverride: "Scout",
      maxHpOverride: null,
      processingPowerOverride: 4,
      processingPowerMaxPotentialOverride: 5,
      batteryCapacityOverride: 8,
    });
    getBotMock.mockResolvedValue({
      ...loader,
      processingPower: 1,
      batteryCapacity: 2,
    });
    const { POST } = await import("@/app/api/characters/[id]/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ botId: "ub-1", sourceType: "UNIQUE" }, "user-1"),
      makeParams({ id: "char-1" })
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      displayName: "Scout",
      attributes: {
        processingPower: {
          base: 4,
          maxPotential: 5,
          upgrade: 0,
          effective: 4,
          signedUpgrade: null,
        },
      },
      battery: { base: 8, used: 0, remaining: 8 },
    });
  });
});
