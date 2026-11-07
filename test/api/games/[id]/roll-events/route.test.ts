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

const prismaMocks = vi.hoisted(() => ({
  discordIntegration: { findUnique: vi.fn() },
  rollEvent: { create: vi.fn() },
  discordOutbox: { create: vi.fn() },
  user: { findUnique: vi.fn() },
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
    getBotCharacterRowMock.mockResolvedValue(null);
    resolveHoldingTemplateMock.mockResolvedValue(null);
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
      overrides: Record<string, number> = {}
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
        message: "Battery is not rolled.",
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
  });
});
