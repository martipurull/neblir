import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const userIsInGameMock = vi.fn();
const getGameMock = vi.fn();
const characterIsInGameMock = vi.fn();
const userHasPlayControlInGameMock = vi.fn();
const getGameCharacterLinkIsPublicMock = vi.fn();
const getEnemyInstanceIsPublicMock = vi.fn();
const getBotCharacterRowMock = vi.fn();
const resolveHoldingTemplateMock = vi.fn();
const setBotReactionsRemainingMock = vi.fn();
const loadBotHandWeaponMock = vi.fn();
const spendBotWeaponUseMock = vi.fn();

const prismaMocks = vi.hoisted(() => ({
  discordIntegration: { findUnique: vi.fn() },
  rollEvent: { create: vi.fn() },
  discordOutbox: { create: vi.fn() },
  user: { findUnique: vi.fn() },
  itemCharacter: { findUnique: vi.fn() },
  item: { findUnique: vi.fn() },
  customItem: { findUnique: vi.fn() },
  uniqueItem: { findUnique: vi.fn() },
}));

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  characterIsInGame: characterIsInGameMock,
  userHasPlayControlInGame: userHasPlayControlInGameMock,
  getGameCharacterLinkIsPublic: getGameCharacterLinkIsPublicMock,
}));

vi.mock("@/app/lib/prisma/enemyInstance", () => ({
  getEnemyInstanceIsPublic: getEnemyInstanceIsPublicMock,
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: prismaMocks,
}));

vi.mock("@/app/lib/prisma/botCharacter", () => ({
  getBotCharacterRow: (...args: unknown[]) => getBotCharacterRowMock(...args),
  resolveHoldingTemplate: (...args: unknown[]) =>
    resolveHoldingTemplateMock(...args),
  setBotReactionsRemaining: (...args: unknown[]) =>
    setBotReactionsRemainingMock(...args),
}));

vi.mock("@/app/lib/prisma/botHandWeapon", () => ({
  loadBotHandWeapon: (...args: unknown[]) => loadBotHandWeaponMock(...args),
  spendBotWeaponUse: (...args: unknown[]) => spendBotWeaponUseMock(...args),
}));

describe("/api/games/[id]/roll-events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsInGameMock.mockResolvedValue(true);
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    characterIsInGameMock.mockResolvedValue(true);
    userHasPlayControlInGameMock.mockResolvedValue(true);
    getGameCharacterLinkIsPublicMock.mockResolvedValue(true);
    getEnemyInstanceIsPublicMock.mockResolvedValue(null);
    prismaMocks.discordIntegration.findUnique.mockResolvedValue(null);
    prismaMocks.rollEvent.create.mockResolvedValue({ id: "re-1" });
    prismaMocks.discordOutbox.create.mockResolvedValue({});
    prismaMocks.user.findUnique.mockResolvedValue({ name: "Ada" });
    prismaMocks.itemCharacter.findUnique.mockResolvedValue(null);
    prismaMocks.item.findUnique.mockResolvedValue(null);
    prismaMocks.customItem.findUnique.mockResolvedValue(null);
    prismaMocks.uniqueItem.findUnique.mockResolvedValue(null);
    getBotCharacterRowMock.mockResolvedValue(null);
    resolveHoldingTemplateMock.mockResolvedValue(null);
    setBotReactionsRemainingMock.mockResolvedValue({});
    loadBotHandWeaponMock.mockResolvedValue(null);
    spendBotWeaponUseMock.mockResolvedValue(undefined);
  });

  describe("POST", () => {
    it("returns 401 when unauthenticated", async () => {
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeUnauthedRequest(),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when caller is not part of the game", async () => {
      userIsInGameMock.mockResolvedValue(false);
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            diceExpression: "2d10",
            results: [10, 7],
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
    });

    it("defaults isPrivate=true for GM rolls on private NPC links", async () => {
      getGameCharacterLinkIsPublicMock.mockResolvedValue(false);
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            diceExpression: "2d10",
            results: [10, 7],
            metadata: { label1: "Agility" },
          },
          "gm-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);

      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            label1: "Agility",
            isPrivate: true,
          }),
        }),
      });
    });

    it("defaults isPrivate=true for GM enemy rolls on private instances", async () => {
      getEnemyInstanceIsPublicMock.mockResolvedValue(false);
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            rollType: "ATTACK",
            diceExpression: "3d10",
            results: [10, 8, 5],
            metadata: {
              source: "enemyInstance",
              enemyInstanceId: "ei-1",
              enemyName: "Stalker",
            },
          },
          "gm-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);

      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            enemyInstanceId: "ei-1",
            isPrivate: true,
          }),
        }),
      });
    });

    it("allows GM to opt out of private roll on private NPC links", async () => {
      getGameCharacterLinkIsPublicMock.mockResolvedValue(false);
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            isPrivate: false,
            rollType: "GENERAL_ROLL",
            diceExpression: "2d10",
            results: [10, 7],
            metadata: { label1: "Agility" },
          },
          "gm-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);

      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { label1: "Agility" },
        }),
      });
    });

    it("persists isPrivate=true into roll metadata", async () => {
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            isPrivate: true,
            rollType: "GENERAL_ROLL",
            diceExpression: "2d10",
            results: [10, 7],
            metadata: { label1: "Agility", label2: "Stealth" },
          },
          "gm-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);

      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            label1: "Agility",
            label2: "Stealth",
            isPrivate: true,
          }),
        }),
      });
    });

    it("allows a play-grant holder to emit a roll in that game", async () => {
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            diceExpression: "2d10",
            results: [10, 7],
          },
          "grantee-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      expect(userHasPlayControlInGameMock).toHaveBeenCalledWith(
        "g-1",
        "c-1",
        "grantee-1"
      );
    });

    it("returns 403 when the caller does not have play control in this game", async () => {
      userHasPlayControlInGameMock.mockResolvedValue(false);
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            diceExpression: "2d10",
            results: [10, 7],
          },
          "other-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
      expect(prismaMocks.rollEvent.create).not.toHaveBeenCalled();
    });

    it("does not force private for a play-grant grantee on a public character link", async () => {
      getGameCharacterLinkIsPublicMock.mockResolvedValue(true);
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            diceExpression: "2d10",
            results: [10, 7],
            metadata: { label1: "Agility" },
          },
          "grantee-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { label1: "Agility" },
        }),
      });
    });

    it("defaults private for a play-grant grantee on a private character link", async () => {
      getGameCharacterLinkIsPublicMock.mockResolvedValue(false);
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            diceExpression: "2d10",
            results: [10, 7],
            metadata: { label1: "Agility" },
          },
          "grantee-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            label1: "Agility",
            isPrivate: true,
          }),
        }),
      });
    });

    function botTemplate(
      overrides: Record<string, unknown> = {}
    ): Record<string, unknown> {
      return {
        id: "bot-1",
        name: "Loader",
        imageKey: null,
        description: null,
        confCost: null,
        usage: null,
        notes: null,
        maxHp: 10,
        accessType: "PLAYER",
        maxCargoWeightKg: null,
        maxInstalledItems: null,
        speed: 0,
        maxCarryWeight: 0,
        heightMetres: null,
        weight: null,
        processingPower: 2,
        processingPowerMaxPotential: 2,
        physicalPower: 5,
        physicalPowerMaxPotential: 2,
        finesseCapacity: 0,
        finesseCapacityMaxPotential: 0,
        gridProtection: 1,
        gridProtectionMaxPotential: 1,
        batteryCapacity: 2,
        batteryMaxPotential: 0,
        ...overrides,
      };
    }

    function botHolding(
      overrides: Record<string, unknown> = {}
    ): Record<string, unknown> {
      return {
        id: "hold-1",
        characterId: "c-1",
        botId: "bot-1",
        sourceType: "OFFICIAL",
        customName: "Mule",
        currentHp: 8,
        maxHpBonus: 0,
        notes: null,
        processingPowerUpgrade: 1,
        physicalPowerUpgrade: 0,
        finesseCapacityUpgrade: 0,
        gridProtectionUpgrade: 0,
        batteryUpgrade: 0,
        batteryUsed: 0,
        isBeyondRepair: false,
        ...overrides,
      };
    }

    it("rolls one bot attribute from its effective value and counts 8–10 as successes", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(botTemplate());
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [10, 8, 3, 1],
            botCharacterId: "hold-1",
            botAttribute: "processingPower",
            extraDice: 1,
            metadata: { label1: "Strength", label2: "Agility" },
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({
        id: "re-1",
        queued: false,
        attribution: "Ada as Mule",
        successes: 2,
      });
      expect(userHasPlayControlInGameMock).toHaveBeenCalledWith(
        "g-1",
        "c-1",
        "user-1"
      );
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: {
          gameId: "g-1",
          characterId: "c-1",
          rollerUserId: "user-1",
          rollType: "GENERAL_ROLL",
          diceExpression: "4d10",
          results: [10, 8, 3, 1],
          total: 2,
          metadata: {
            label1: "Processing Power",
            attribute: "processingPower",
            botCharacterId: "hold-1",
            botDisplayName: "Mule",
            extraDice: 1,
            baseDice: 3,
          },
        },
      });
    });

    it("uses a pool of 1 when the effective attribute is lower, and lets extra dice subtract", async () => {
      getBotCharacterRowMock.mockResolvedValue(
        botHolding({ processingPowerUpgrade: 0 })
      );
      resolveHoldingTemplateMock.mockResolvedValue(
        botTemplate({ processingPower: -4 })
      );
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const low = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [9],
            botCharacterId: "hold-1",
            botAttribute: "processingPower",
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(low.status).toBe(201);
      expect(await low.json()).toMatchObject({ successes: 1 });
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          diceExpression: "1d10",
          total: 1,
          metadata: expect.objectContaining({ baseDice: 1, extraDice: 0 }),
        }),
      });

      prismaMocks.rollEvent.create.mockClear();
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(botTemplate());
      const reduced = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [10, 2],
            botCharacterId: "hold-1",
            botAttribute: "processingPower",
            extraDice: -1,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(reduced.status).toBe(201);
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          diceExpression: "2d10",
          results: [10, 2],
          total: 1,
          metadata: expect.objectContaining({ baseDice: 3, extraDice: -1 }),
        }),
      });
    });

    it("attributes a private bot roll, including the holding character's private default, as SECRET ROLL", async () => {
      getGameCharacterLinkIsPublicMock.mockResolvedValue(false);
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(botTemplate());
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [10, 4, 8],
            botCharacterId: "hold-1",
            botAttribute: "finesseCapacity",
            extraDice: 2,
          },
          "gm-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(201);
      expect(await response.json()).toMatchObject({
        attribution: "SECRET ROLL",
        successes: 2,
      });
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          characterId: "c-1",
          rollerUserId: "gm-1",
          diceExpression: "3d10",
          metadata: expect.objectContaining({
            label1: "Finesse Capacity",
            attribute: "finesseCapacity",
            botCharacterId: "hold-1",
            botDisplayName: "Mule",
            isPrivate: true,
            baseDice: 1,
            extraDice: 2,
          }),
        }),
      });
    });

    it("refuses a dice count that does not match the pool plus extra dice", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(botTemplate());
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [10, 8, 3, 1, 9, 6, 5, 4],
            botCharacterId: "hold-1",
            botAttribute: "processingPower",
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        message: "Dice count does not match the pool plus extra dice.",
      });
      expect(prismaMocks.rollEvent.create).not.toHaveBeenCalled();
    });

    it("refuses a bot attribute roll of zero dice", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(botTemplate());
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [4],
            botCharacterId: "hold-1",
            botAttribute: "processingPower",
            extraDice: -3,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        message: "A bot attribute roll needs at least one die.",
      });
      expect(prismaMocks.rollEvent.create).not.toHaveBeenCalled();
    });

    it("refuses a bot attribute roll while the bot is Broken", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding({ currentHp: 0 }));
      resolveHoldingTemplateMock.mockResolvedValue(botTemplate());
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [8, 8, 8],
            botCharacterId: "hold-1",
            botAttribute: "processingPower",
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        message: "This bot cannot roll while it is Broken.",
      });
      expect(prismaMocks.rollEvent.create).not.toHaveBeenCalled();
    });

    it("refuses a bot attribute roll while the bot is Beyond repair", async () => {
      getBotCharacterRowMock.mockResolvedValue(
        botHolding({ isBeyondRepair: true })
      );
      resolveHoldingTemplateMock.mockResolvedValue(botTemplate());
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [8, 8, 8],
            botCharacterId: "hold-1",
            botAttribute: "physicalPower",
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        message: "This bot cannot roll while it is Beyond repair.",
      });
      expect(prismaMocks.rollEvent.create).not.toHaveBeenCalled();
    });

    it("refuses a bot attribute roll while the battery is empty", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding({ batteryUsed: 1 }));
      resolveHoldingTemplateMock.mockResolvedValue(
        botTemplate({ batteryCapacity: 1 })
      );
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [8, 8, 8],
            botCharacterId: "hold-1",
            botAttribute: "gridProtection",
            extraDice: 2,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        message: "This bot cannot roll while its battery is empty.",
      });
      expect(prismaMocks.rollEvent.create).not.toHaveBeenCalled();
    });

    it("returns 404 when the bot holding is not on that character", async () => {
      getBotCharacterRowMock.mockResolvedValue(null);
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [8, 8, 8],
            botCharacterId: "hold-1",
            botAttribute: "processingPower",
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        message: "Bot holding not found",
      });
      expect(prismaMocks.rollEvent.create).not.toHaveBeenCalled();
    });

    it("returns 404 when the bot template is missing", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(null);
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [8, 8, 8],
            botCharacterId: "hold-1",
            botAttribute: "processingPower",
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        message: "Official bot not found",
      });
      expect(prismaMocks.rollEvent.create).not.toHaveBeenCalled();
    });

    function meleeWeapon(
      overrides: Record<string, unknown> = {}
    ): Record<string, unknown> {
      return {
        itemCharacterId: "item-1",
        displayName: "Mace",
        attackModes: ["MELEE"],
        attackMeleeBonus: 1,
        attackRangeBonus: 0,
        maxUses: 3,
        currentUses: 2,
        operational: true,
        handEquipped: true,
        damage: { numberOfDice: 2, diceType: 6 },
        ...overrides,
      };
    }

    it("rolls a bot weapon attack from the authored value, attribute, and weapon bonus, then spends one use", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(
        botTemplate({ attackMelee: 1, physicalPower: 1 })
      );
      loadBotHandWeaponMock.mockResolvedValue(meleeWeapon());
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "ATTACK",
            results: [10, 2, 8],
            botCharacterId: "hold-1",
            botCombat: "attackMelee",
            botWeaponItemCharacterId: "item-1",
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(201);
      expect(await response.json()).toMatchObject({
        attribution: "Ada as Mule",
        successes: 2,
      });
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          rollType: "ATTACK",
          diceExpression: "3d10",
          results: [10, 2, 8],
          total: 2,
          metadata: expect.objectContaining({
            label1: "Attack Melee",
            botCombat: "attackMelee",
            weaponName: "Mace",
            baseDice: 3,
            extraDice: 0,
            itemCharacterId: "item-1",
          }),
        }),
      });
      expect(spendBotWeaponUseMock).toHaveBeenCalledWith("item-1", 2);
      expect(setBotReactionsRemainingMock).not.toHaveBeenCalled();
      expect(spendBotWeaponUseMock.mock.invocationCallOrder[0]).toBeGreaterThan(
        prismaMocks.rollEvent.create.mock.invocationCallOrder[0] ?? 0
      );

      prismaMocks.rollEvent.create.mockClear();
      spendBotWeaponUseMock.mockClear();
      const damage = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "ATTACK_DAMAGE",
            results: [4, 2],
            botCharacterId: "hold-1",
            botCombat: "attackMelee",
            botWeaponItemCharacterId: "item-1",
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(damage.status).toBe(201);
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          rollType: "ATTACK_DAMAGE",
          diceExpression: "2d6",
          results: [4, 2],
          total: 6,
        }),
      });
      expect(spendBotWeaponUseMock).not.toHaveBeenCalled();
    });

    it("does not spend a use when the roll event is not saved", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(
        botTemplate({ attackMelee: 1, physicalPower: 1 })
      );
      loadBotHandWeaponMock.mockResolvedValue(meleeWeapon());
      prismaMocks.rollEvent.create.mockRejectedValue(new Error("db down"));
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "ATTACK",
            results: [10, 2, 8],
            botCharacterId: "hold-1",
            botCombat: "attackMelee",
            botWeaponItemCharacterId: "item-1",
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(500);
      expect(spendBotWeaponUseMock).not.toHaveBeenCalled();
    });

    it("rolls Unarmed with no weapon bonus and 1d4 bludgeoning damage", async () => {
      getBotCharacterRowMock.mockResolvedValue(
        botHolding({ physicalPowerUpgrade: 0 })
      );
      resolveHoldingTemplateMock.mockResolvedValue(
        botTemplate({ attackMelee: 2, physicalPower: 3 })
      );
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const attack = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "ATTACK",
            results: [9, 1, 8, 3, 10],
            botCharacterId: "hold-1",
            botCombat: "attackMelee",
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(attack.status).toBe(201);
      expect(await attack.json()).toMatchObject({ successes: 3 });
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          diceExpression: "5d10",
          total: 3,
          metadata: expect.objectContaining({
            weaponName: "Unarmed",
            baseDice: 5,
          }),
        }),
      });
      expect(loadBotHandWeaponMock).not.toHaveBeenCalled();
      expect(spendBotWeaponUseMock).not.toHaveBeenCalled();

      prismaMocks.rollEvent.create.mockClear();
      const damage = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "ATTACK_DAMAGE",
            results: [3],
            botCharacterId: "hold-1",
            botCombat: "attackMelee",
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(damage.status).toBe(201);
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          diceExpression: "1d4",
          results: [3],
          total: 3,
          metadata: expect.objectContaining({ weaponName: "Unarmed" }),
        }),
      });
    });

    it("refuses a bot attack with a weapon that has no uses left", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(
        botTemplate({ attackMelee: 1, physicalPower: 1 })
      );
      loadBotHandWeaponMock.mockResolvedValue(
        meleeWeapon({ maxUses: 1, currentUses: 0 })
      );
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "ATTACK",
            results: [8, 8, 8],
            botCharacterId: "hold-1",
            botCombat: "attackMelee",
            botWeaponItemCharacterId: "item-1",
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        message: "That weapon has no uses left.",
      });
      expect(prismaMocks.rollEvent.create).not.toHaveBeenCalled();
      expect(spendBotWeaponUseMock).not.toHaveBeenCalled();
    });

    it("spends one Reaction when a bot defence is accepted", async () => {
      getBotCharacterRowMock.mockResolvedValue(
        botHolding({ reactionsRemaining: 2 })
      );
      resolveHoldingTemplateMock.mockResolvedValue(
        botTemplate({ defenceMelee: 2, physicalPower: 3 })
      );
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "DEFENCE",
            results: [10, 1, 8, 2, 9],
            botCharacterId: "hold-1",
            botCombat: "defenceMelee",
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(201);
      expect(await response.json()).toMatchObject({
        attribution: "Ada as Mule",
        successes: 3,
      });
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          rollType: "DEFENCE",
          diceExpression: "5d10",
          total: 3,
          metadata: expect.objectContaining({
            label1: "Defence Melee",
            baseDice: 5,
          }),
        }),
      });
      expect(setBotReactionsRemainingMock).toHaveBeenCalledWith("hold-1", 1);
      expect(spendBotWeaponUseMock).not.toHaveBeenCalled();
    });

    it("refuses a bot defence when no Reactions remain", async () => {
      getBotCharacterRowMock.mockResolvedValue(
        botHolding({ reactionsRemaining: 0, currentHp: 8, batteryUsed: 0 })
      );
      resolveHoldingTemplateMock.mockResolvedValue(
        botTemplate({ defenceRange: 3, finesseCapacity: 2, batteryCapacity: 2 })
      );
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "DEFENCE",
            results: [8, 8, 8, 8, 8],
            botCharacterId: "hold-1",
            botCombat: "defenceRange",
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        message: "This bot has no Reactions remaining.",
      });
      expect(prismaMocks.rollEvent.create).not.toHaveBeenCalled();
      expect(setBotReactionsRemainingMock).not.toHaveBeenCalled();
    });

    it("refuses to roll battery", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(botTemplate());
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [8],
            botCharacterId: "hold-1",
            botAttribute: "battery",
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        message:
          "Roll one of Processing Power, Physical Power, Finesse Capacity, or Grid Protection. Battery is not rolled.",
      });
      expect(prismaMocks.rollEvent.create).not.toHaveBeenCalled();
    });

    it("attributes a public bot initiative roll to the roller as the bot", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(botTemplate());
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "INITIATIVE",
            results: [8],
            botCharacterId: "hold-1",
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(201);
      expect(await response.json()).toMatchObject({
        attribution: "Ada as Mule",
      });
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          characterId: "c-1",
          rollerUserId: "user-1",
          rollType: "INITIATIVE",
          diceExpression: "1d10",
          results: [8],
          total: 9,
          metadata: expect.objectContaining({
            botCharacterId: "hold-1",
            botDisplayName: "Mule",
            initiativeModifier: 1,
          }),
        }),
      });
    });

    it("attributes a private bot initiative roll as SECRET ROLL", async () => {
      getGameCharacterLinkIsPublicMock.mockResolvedValue(false);
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(botTemplate());
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "INITIATIVE",
            results: [8],
            botCharacterId: "hold-1",
          },
          "gm-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(201);
      expect(await response.json()).toMatchObject({
        attribution: "SECRET ROLL",
      });
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          diceExpression: "1d10",
          total: 9,
          metadata: expect.objectContaining({
            botDisplayName: "Mule",
            isPrivate: true,
          }),
        }),
      });
    });

    it("refuses extra dice on a bot initiative roll event", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(botTemplate());
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "INITIATIVE",
            results: [8],
            botCharacterId: "hold-1",
            extraDice: 2,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        message: "A bot initiative roll does not accept extra dice.",
      });
      expect(prismaMocks.rollEvent.create).not.toHaveBeenCalled();
    });

    it("does not let a play-grant grantee un-hide a private-link roll", async () => {
      getGameCharacterLinkIsPublicMock.mockResolvedValue(false);
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            isPrivate: false,
            rollType: "GENERAL_ROLL",
            diceExpression: "2d10",
            results: [10, 7],
            metadata: { label1: "Agility" },
          },
          "grantee-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            label1: "Agility",
            isPrivate: true,
          }),
        }),
      });
    });

    const weld = {
      name: "Weld",
      description: null,
      notes: null,
      numberOfDice: 0,
      attribute: "processingPower",
      damage: null,
    };

    it("rolls a bot action to-hit pool and does not spend a Reaction", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(
        botTemplate({ actions: [weld] })
      );
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [10, 8, 3, 1],
            botCharacterId: "hold-1",
            botAction: { list: "actions", index: 0 },
            extraDice: 1,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({
        id: "re-1",
        queued: false,
        attribution: "Ada as Mule",
        successes: 2,
      });
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          diceExpression: "4d10",
          results: [10, 8, 3, 1],
          total: 2,
          metadata: expect.objectContaining({
            label1: "Weld",
            baseDice: 3,
            extraDice: 1,
            attribute: "processingPower",
            botDisplayName: "Mule",
          }),
        }),
      });
      expect(setBotReactionsRemainingMock).not.toHaveBeenCalled();
    });

    it("rolls bot action damage and sums the faces", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(
        botTemplate({
          actions: [
            {
              name: "Saw",
              numberOfDice: 1,
              attribute: null,
              damage: {
                numberOfDice: 1,
                diceType: 6,
                damageType: "BLADE",
                attribute: "physicalPower",
              },
            },
          ],
        })
      );
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [10],
            damageResults: [6, 5, 4, 3, 2, 1],
            botCharacterId: "hold-1",
            botAction: { list: "actions", index: 0 },
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(201);
      expect(await response.json()).toMatchObject({
        successes: 1,
        damageTotal: 21,
      });
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          diceExpression: "1d10",
          total: 1,
          metadata: expect.objectContaining({
            label1: "Saw",
            damage: expect.objectContaining({
              diceExpression: "6d6",
              total: 21,
              damageType: "BLADE",
              baseDice: 6,
            }),
          }),
        }),
      });
    });

    it("rolls an installed item's bot action", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(botTemplate());
      prismaMocks.itemCharacter.findUnique.mockResolvedValue({
        id: "row-1",
        characterId: "c-1",
        sourceType: "GLOBAL_ITEM",
        itemId: "item-1",
        itemLocation: "bot-installed:hold-1",
      });
      prismaMocks.item.findUnique.mockResolvedValue({
        id: "item-1",
        name: "Torch",
        botActions: [
          {
            name: "Flare",
            numberOfDice: 2,
            attribute: null,
            damage: null,
          },
        ],
      });
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [8, 1],
            botCharacterId: "hold-1",
            botItemAction: { itemCharacterId: "row-1", index: 0 },
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(201);
      expect(await response.json()).toMatchObject({ successes: 1 });
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          diceExpression: "2d10",
          metadata: expect.objectContaining({
            label1: "Flare",
            itemCharacterId: "row-1",
            itemName: "Torch",
          }),
        }),
      });
    });

    it("refuses an item action once the item is no longer installed", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(botTemplate());
      prismaMocks.itemCharacter.findUnique.mockResolvedValue({
        id: "row-1",
        characterId: "c-1",
        sourceType: "GLOBAL_ITEM",
        itemId: "item-1",
        itemLocation: "bot-cargo:hold-1",
      });
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [8, 1],
            botCharacterId: "hold-1",
            botItemAction: { itemCharacterId: "row-1", index: 0 },
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        message: "That item is not installed on this bot.",
      });
      expect(prismaMocks.rollEvent.create).not.toHaveBeenCalled();
    });

    it("uses a unique item's bot action override instead of the template list", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(botTemplate());
      prismaMocks.itemCharacter.findUnique.mockResolvedValue({
        id: "row-1",
        characterId: "c-1",
        sourceType: "UNIQUE_ITEM",
        itemId: "unique-1",
        itemLocation: "bot-installed:hold-1",
      });
      prismaMocks.uniqueItem.findUnique.mockResolvedValue({
        id: "unique-1",
        sourceType: "GLOBAL_ITEM",
        itemId: "item-1",
        nameOverride: "Tuned torch",
        botActionsOverride: [
          { name: "Flare", numberOfDice: 2, attribute: null, damage: null },
        ],
      });
      prismaMocks.item.findUnique.mockResolvedValue({
        id: "item-1",
        name: "Torch",
        botActions: [
          { name: "Flare", numberOfDice: 4, attribute: null, damage: null },
        ],
      });
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [10, 3],
            botCharacterId: "hold-1",
            botItemAction: { itemCharacterId: "row-1", index: 0 },
            extraDice: 0,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(201);
      expect(prismaMocks.rollEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          diceExpression: "2d10",
          metadata: expect.objectContaining({
            label1: "Flare",
            baseDice: 2,
            itemName: "Tuned torch",
          }),
        }),
      });
    });

    it("refuses a bot action when the dice do not match the pool", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding());
      resolveHoldingTemplateMock.mockResolvedValue(
        botTemplate({ actions: [weld] })
      );
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [10],
            botCharacterId: "hold-1",
            botAction: { list: "actions", index: 0 },
            extraDice: 1,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        message: "Dice count does not match the pool plus extra dice.",
      });
      expect(prismaMocks.rollEvent.create).not.toHaveBeenCalled();
    });

    it("refuses a bot action while the bot is Broken", async () => {
      getBotCharacterRowMock.mockResolvedValue(botHolding({ currentHp: 0 }));
      resolveHoldingTemplateMock.mockResolvedValue(
        botTemplate({ actions: [weld] })
      );
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            characterId: "c-1",
            rollType: "GENERAL_ROLL",
            results: [10, 8, 3, 1],
            botCharacterId: "hold-1",
            botAction: { list: "actions", index: 0 },
            extraDice: 1,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        message: "This bot cannot roll while it is Broken.",
      });
      expect(prismaMocks.rollEvent.create).not.toHaveBeenCalled();
    });
  });
});
