import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameWithDetailsMock = vi.fn();
const updateGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const characterIsInGameMock = vi.fn();
const userOwnsCharacterMock = vi.fn();
const userHasPlayControlInGameMock = vi.fn();
const getBotCharacterByIdMock = vi.fn();
const resolveHoldingTemplateMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGameWithDetails: getGameWithDetailsMock,
  updateGame: updateGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  characterIsInGame: characterIsInGameMock,
  userOwnsCharacter: userOwnsCharacterMock,
  userHasPlayControlInGame: userHasPlayControlInGameMock,
}));

vi.mock("@/app/lib/prisma/botCharacter", () => ({
  getBotCharacterById: (...args: unknown[]) => getBotCharacterByIdMock(...args),
  resolveHoldingTemplate: (...args: unknown[]) =>
    resolveHoldingTemplateMock(...args),
}));

describe("/api/games/[id]/initiative", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const gameCharacterC1 = {
    character: {
      id: "c-1",
      generalInformation: { name: "Hero", surname: "" },
      combatInformation: {},
      users: [{ userId: "user-1" }],
    },
  };

  const baseGame = {
    id: "g-1",
    gameMaster: "gm-1",
    name: "Game",
    users: [],
    characters: [gameCharacterC1],
    customItems: [],
    initiativeOrder: [],
  };

  describe("POST", () => {
    it("returns 401 when unauthenticated", async () => {
      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeUnauthedRequest({}),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when user is not in game", async () => {
      userIsInGameMock.mockResolvedValue(false);
      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "CHARACTER",
            combatantId: "c-1",
            rolledValue: 15,
            initiativeModifier: 2,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
    });

    it("returns 409 when character already submitted", async () => {
      userIsInGameMock.mockResolvedValue(true);
      getGameWithDetailsMock.mockResolvedValue({
        ...baseGame,
        initiativeOrder: [
          {
            combatantType: "CHARACTER" as const,
            combatantId: "c-1",
            combatantName: "Hero",
            rolledValue: 10,
            initiativeModifier: 2,
            submittedAt: new Date(),
          },
        ],
      });
      characterIsInGameMock.mockResolvedValue(true);
      userOwnsCharacterMock.mockResolvedValue(true);
      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "CHARACTER",
            combatantId: "c-1",
            rolledValue: 15,
            initiativeModifier: 2,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(409);
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("returns 201 and appends initiative when valid", async () => {
      userIsInGameMock.mockResolvedValue(true);
      getGameWithDetailsMock
        .mockResolvedValueOnce({ ...baseGame, initiativeOrder: [] })
        .mockResolvedValueOnce({
          ...baseGame,
          initiativeOrder: [
            {
              combatantType: "CHARACTER" as const,
              combatantId: "c-1",
              combatantName: "Hero",
              rolledValue: 15,
              initiativeModifier: 2,
              submittedAt: new Date("2025-01-01T12:00:00Z"),
            },
          ],
        });
      characterIsInGameMock.mockResolvedValue(true);
      userOwnsCharacterMock.mockResolvedValue(true);
      updateGameMock.mockResolvedValue(undefined);
      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "CHARACTER",
            combatantId: "c-1",
            rolledValue: 15,
            initiativeModifier: 2,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      expect(updateGameMock).toHaveBeenCalledWith("g-1", {
        initiativeOrder: expect.arrayContaining([
          expect.objectContaining({
            combatantType: "CHARACTER",
            combatantId: "c-1",
            rolledValue: 15,
            initiativeModifier: 2,
          }),
        ]),
      });
    });

    it("adds a bot holding that is not already in the order and snapshots its modifier", async () => {
      userIsInGameMock.mockResolvedValue(true);
      characterIsInGameMock.mockResolvedValue(true);
      userHasPlayControlInGameMock.mockResolvedValue(true);
      getBotCharacterByIdMock.mockResolvedValue({
        id: "hold-1",
        characterId: "c-1",
        botId: "bot-1",
        sourceType: "OFFICIAL",
        customName: "Mule",
        currentHp: 8,
        maxHpBonus: 0,
        notes: null,
        processingPowerUpgrade: -1,
        physicalPowerUpgrade: 0,
        finesseCapacityUpgrade: 1,
        gridProtectionUpgrade: 0,
        batteryUpgrade: 0,
        batteryUsed: 0,
        isBeyondRepair: false,
      });
      resolveHoldingTemplateMock.mockResolvedValue({
        id: "bot-1",
        name: "Loader",
        maxHp: 10,
        processingPower: -4,
        processingPowerMaxPotential: 0,
        physicalPower: 0,
        physicalPowerMaxPotential: 0,
        finesseCapacity: 1,
        finesseCapacityMaxPotential: 0,
        gridProtection: 0,
        gridProtectionMaxPotential: 0,
        batteryCapacity: 2,
        batteryMaxPotential: 0,
      });
      getGameWithDetailsMock
        .mockResolvedValueOnce({ ...baseGame, initiativeOrder: [] })
        .mockResolvedValueOnce({
          ...baseGame,
          initiativeOrder: [
            {
              combatantType: "BOT",
              combatantId: "hold-1",
              combatantName: "Mule",
              rolledValue: 8,
              initiativeModifier: -1,
              submittedAt: new Date("2026-01-01T00:00:00Z"),
            },
          ],
        });
      updateGameMock.mockResolvedValue(undefined);

      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "BOT",
            combatantId: "hold-1",
            rolledValue: 8,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(201);
      const body = (await response.json()) as {
        initiativeOrder: Array<{
          combatantType: string;
          combatantId: string;
          displayName: string | null;
          initiativeModifier: number;
        }>;
      };
      expect(body.initiativeOrder[0]).toMatchObject({
        combatantType: "BOT",
        combatantId: "hold-1",
        displayName: "Mule",
        initiativeModifier: -1,
      });
      expect(updateGameMock).toHaveBeenCalledWith("g-1", {
        initiativeOrder: [
          {
            combatantType: "BOT",
            combatantId: "hold-1",
            combatantName: "Mule",
            rolledValue: 8,
            initiativeModifier: -1,
            submittedAt: expect.any(Date),
          },
        ],
      });
      expect(characterIsInGameMock).toHaveBeenCalledWith("g-1", "c-1");
    });

    function operationalBot() {
      getBotCharacterByIdMock.mockResolvedValue({
        id: "hold-1",
        characterId: "c-1",
        botId: "bot-1",
        sourceType: "OFFICIAL",
        customName: "Mule",
        currentHp: 8,
        maxHpBonus: 0,
        notes: null,
        processingPowerUpgrade: 0,
        physicalPowerUpgrade: 0,
        finesseCapacityUpgrade: 0,
        gridProtectionUpgrade: 0,
        batteryUpgrade: 0,
        batteryUsed: 0,
        isBeyondRepair: false,
      });
      resolveHoldingTemplateMock.mockResolvedValue({
        id: "bot-1",
        name: "Loader",
        maxHp: 10,
        processingPower: 2,
        processingPowerMaxPotential: 2,
        physicalPower: 0,
        physicalPowerMaxPotential: 0,
        finesseCapacity: 2,
        finesseCapacityMaxPotential: 0,
        gridProtection: 0,
        gridProtectionMaxPotential: 0,
        batteryCapacity: 2,
        batteryMaxPotential: 0,
      });
    }

    it("refuses a second initiative entry for the same holding in the game", async () => {
      userIsInGameMock.mockResolvedValue(true);
      characterIsInGameMock.mockResolvedValue(true);
      userHasPlayControlInGameMock.mockResolvedValue(true);
      operationalBot();
      getGameWithDetailsMock.mockResolvedValue({
        ...baseGame,
        initiativeOrder: [
          {
            combatantType: "BOT",
            combatantId: "hold-1",
            combatantName: "Mule",
            rolledValue: 4,
            initiativeModifier: 2,
            submittedAt: new Date(),
          },
        ],
      });

      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "BOT",
            combatantId: "hold-1",
            rolledValue: 6,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(409);
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("refuses initiative when the holding character is not linked to the game", async () => {
      userIsInGameMock.mockResolvedValue(true);
      characterIsInGameMock.mockResolvedValue(false);
      operationalBot();
      getGameWithDetailsMock.mockResolvedValue({
        ...baseGame,
        initiativeOrder: [],
      });

      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "BOT",
            combatantId: "hold-1",
            rolledValue: 6,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        message: "Character is not in this game",
      });
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("refuses initiative for a Broken bot", async () => {
      userIsInGameMock.mockResolvedValue(true);
      characterIsInGameMock.mockResolvedValue(true);
      userHasPlayControlInGameMock.mockResolvedValue(true);
      operationalBot();
      getBotCharacterByIdMock.mockResolvedValue({
        id: "hold-1",
        characterId: "c-1",
        botId: "bot-1",
        sourceType: "OFFICIAL",
        customName: "Mule",
        currentHp: 0,
        maxHpBonus: 0,
        notes: null,
        processingPowerUpgrade: 0,
        finesseCapacityUpgrade: 0,
        batteryUsed: 0,
        isBeyondRepair: false,
      });
      getGameWithDetailsMock.mockResolvedValue({
        ...baseGame,
        initiativeOrder: [],
      });

      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "BOT",
            combatantId: "hold-1",
            rolledValue: 6,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        message: "This bot cannot roll while it is Broken.",
      });
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("refuses initiative when the bot battery is empty", async () => {
      userIsInGameMock.mockResolvedValue(true);
      characterIsInGameMock.mockResolvedValue(true);
      userHasPlayControlInGameMock.mockResolvedValue(true);
      operationalBot();
      getBotCharacterByIdMock.mockResolvedValue({
        id: "hold-1",
        characterId: "c-1",
        botId: "bot-1",
        sourceType: "OFFICIAL",
        customName: "Mule",
        currentHp: 8,
        maxHpBonus: 0,
        notes: null,
        processingPowerUpgrade: 0,
        finesseCapacityUpgrade: 0,
        batteryUsed: 2,
        isBeyondRepair: false,
      });
      getGameWithDetailsMock.mockResolvedValue({
        ...baseGame,
        initiativeOrder: [],
      });

      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "BOT",
            combatantId: "hold-1",
            rolledValue: 6,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        message: "This bot cannot roll while its battery is empty.",
      });
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("refuses initiative for a bot that is Beyond repair", async () => {
      userIsInGameMock.mockResolvedValue(true);
      characterIsInGameMock.mockResolvedValue(true);
      userHasPlayControlInGameMock.mockResolvedValue(true);
      operationalBot();
      getBotCharacterByIdMock.mockResolvedValue({
        id: "hold-1",
        characterId: "c-1",
        botId: "bot-1",
        sourceType: "OFFICIAL",
        customName: "Mule",
        currentHp: 8,
        maxHpBonus: 0,
        notes: null,
        processingPowerUpgrade: 0,
        finesseCapacityUpgrade: 0,
        batteryUsed: 0,
        isBeyondRepair: true,
      });
      getGameWithDetailsMock.mockResolvedValue({
        ...baseGame,
        initiativeOrder: [],
      });

      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "BOT",
            combatantId: "hold-1",
            rolledValue: 6,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        message: "This bot cannot roll while it is Beyond repair.",
      });
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("refuses extra dice on a bot initiative roll", async () => {
      userIsInGameMock.mockResolvedValue(true);
      characterIsInGameMock.mockResolvedValue(true);
      userHasPlayControlInGameMock.mockResolvedValue(true);
      operationalBot();
      getGameWithDetailsMock.mockResolvedValue({
        ...baseGame,
        initiativeOrder: [],
      });

      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "BOT",
            combatantId: "hold-1",
            rolledValue: 6,
            extraDice: 1,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        message: "A bot initiative roll does not accept extra dice.",
      });
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("registers the same holding in a second game and leaves its hit points on the holding", async () => {
      userIsInGameMock.mockResolvedValue(true);
      characterIsInGameMock.mockResolvedValue(true);
      userHasPlayControlInGameMock.mockResolvedValue(true);
      operationalBot();
      getGameWithDetailsMock
        .mockResolvedValueOnce({
          ...baseGame,
          id: "g-2",
          initiativeOrder: [],
        })
        .mockResolvedValueOnce({
          ...baseGame,
          id: "g-2",
          initiativeOrder: [],
        });
      updateGameMock.mockResolvedValue(undefined);

      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "BOT",
            combatantId: "hold-1",
            rolledValue: 3,
          },
          "user-1"
        ),
        makeParams({ id: "g-2" })
      );

      expect(response.status).toBe(201);
      expect(updateGameMock).toHaveBeenCalledWith("g-2", {
        initiativeOrder: [
          expect.objectContaining({
            combatantType: "BOT",
            combatantId: "hold-1",
            combatantName: "Mule",
            rolledValue: 3,
            initiativeModifier: 2,
          }),
        ],
      });
      const stored = updateGameMock.mock.calls[0]?.[1] as {
        initiativeOrder: Array<Record<string, unknown>>;
      };
      expect(stored.initiativeOrder[0]).not.toHaveProperty("currentHp");
    });

    it("refuses initiative when the caller does not have play control", async () => {
      userIsInGameMock.mockResolvedValue(true);
      characterIsInGameMock.mockResolvedValue(true);
      userHasPlayControlInGameMock.mockResolvedValue(false);
      operationalBot();
      getGameWithDetailsMock.mockResolvedValue({
        ...baseGame,
        initiativeOrder: [],
      });

      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "BOT",
            combatantId: "hold-1",
            rolledValue: 6,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        message: "You do not have play control of this character in this game",
      });
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("returns 404 when the bot holding does not exist", async () => {
      userIsInGameMock.mockResolvedValue(true);
      getBotCharacterByIdMock.mockResolvedValue(null);
      getGameWithDetailsMock.mockResolvedValue({
        ...baseGame,
        initiativeOrder: [],
      });

      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "BOT",
            combatantId: "missing",
            rolledValue: 6,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        message: "Bot holding not found",
      });
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("returns 404 when the bot template is missing", async () => {
      userIsInGameMock.mockResolvedValue(true);
      operationalBot();
      resolveHoldingTemplateMock.mockResolvedValue(null);
      getGameWithDetailsMock.mockResolvedValue({
        ...baseGame,
        initiativeOrder: [],
      });

      const { POST } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            combatantType: "BOT",
            combatantId: "hold-1",
            rolledValue: 6,
          },
          "user-1"
        ),
        makeParams({ id: "g-1" })
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({
        message: "Official bot not found",
      });
      expect(updateGameMock).not.toHaveBeenCalled();
    });
  });

  describe("DELETE", () => {
    it("returns 403 when caller is not game master", async () => {
      getGameWithDetailsMock.mockResolvedValue({
        ...baseGame,
        gameMaster: "gm-1",
      });
      const { DELETE } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "user-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
      expect(updateGameMock).not.toHaveBeenCalled();
    });

    it("clears initiative when game master", async () => {
      getGameWithDetailsMock
        .mockResolvedValueOnce({
          ...baseGame,
          gameMaster: "gm-1",
          initiativeOrder: [
            {
              combatantType: "CHARACTER" as const,
              combatantId: "c-1",
              combatantName: "Hero",
              rolledValue: 10,
              initiativeModifier: 0,
              submittedAt: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce({
          ...baseGame,
          gameMaster: "gm-1",
          initiativeOrder: [],
        });
      updateGameMock.mockResolvedValue(undefined);
      const { DELETE } = await import("@/app/api/games/[id]/initiative/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(200);
      expect(updateGameMock).toHaveBeenCalledWith("g-1", {
        initiativeOrder: [],
      });
    });
  });
});
