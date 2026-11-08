import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";

const getUniqueBotMock = vi.fn();
const updateUniqueBotMock = vi.fn();
const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const listBotCharacterRowsByBotMock = vi.fn();
const updateBotCharacterMock = vi.fn();

vi.mock("@/app/lib/prisma/uniqueBot", async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    getUniqueBot: (...args: unknown[]) => getUniqueBotMock(...args),
    updateUniqueBot: (...args: unknown[]) => updateUniqueBotMock(...args),
  };
});

vi.mock("@/app/lib/prisma/botCharacter", async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    listBotCharacterRowsByBot: (...args: unknown[]) =>
      listBotCharacterRowsByBotMock(...args),
    updateBotCharacter: (...args: unknown[]) => updateBotCharacterMock(...args),
  };
});

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: (...args: unknown[]) => getGameMock(...args),
  userIsInGame: (...args: unknown[]) => userIsInGameMock(...args),
}));

const mule = {
  id: "ub-1",
  ownerUserId: "minter-1",
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
  maxCargoWeightKgOverride: null,
  maxInstalledItemsOverride: null,
  templateName: null,
};

describe("PATCH /api/unique-bots/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUniqueBotMock.mockResolvedValue(mule);
    getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "gm-1" });
    userIsInGameMock.mockResolvedValue(false);
    listBotCharacterRowsByBotMock.mockResolvedValue([]);
    updateUniqueBotMock.mockImplementation(
      async (_id: string, data: Record<string, unknown>) => ({
        ...mule,
        ...data,
      })
    );
  });

  it("returns 401 when unauthenticated", async () => {
    const { PATCH } = await import("@/app/api/unique-bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeUnauthedRequest({ nameOverride: "Pack Mule" }),
      makeParams({ id: "ub-1" })
    );
    expect(response.status).toBe(401);
  });

  it("refuses a game master who did not mint the bot", async () => {
    const { PATCH } = await import("@/app/api/unique-bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ nameOverride: "Pack Mule" }, "gm-1"),
      makeParams({ id: "ub-1" })
    );
    expect(response.status).toBe(403);
    expect(updateUniqueBotMock).not.toHaveBeenCalled();
  });

  it("lets the minter change the name override and max HP", async () => {
    const { PATCH } = await import("@/app/api/unique-bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        {
          nameOverride: "Pack Mule",
          maxHpOverride: 11,
          imageKeyOverride: "unique_bots-mule.png",
        },
        "minter-1"
      ),
      makeParams({ id: "ub-1" })
    );
    expect(response.status).toBe(200);
    expect(updateUniqueBotMock).toHaveBeenCalledWith("ub-1", {
      nameOverride: "Pack Mule",
      maxHpOverride: 11,
      imageKeyOverride: "unique_bots-mule.png",
    });
    const body = await response.json();
    expect(body.nameOverride).toBe("Pack Mule");
    expect(body.maxHpOverride).toBe(11);
    expect(updateBotCharacterMock).not.toHaveBeenCalled();
  });

  it("PATCH stores an actions override, including an empty list", async () => {
    const { PATCH } = await import("@/app/api/unique-bots/[id]/route");
    const actionsOverride = [
      {
        name: "Weld",
        description: null,
        notes: null,
        numberOfDice: 1,
        attribute: null,
        damage: null,
      },
    ];
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ actionsOverride }, "minter-1"),
      makeParams({ id: "ub-1" })
    );
    expect(response.status).toBe(200);
    expect(updateUniqueBotMock).toHaveBeenCalledWith("ub-1", {
      actionsOverride,
    });
    expect(await response.json()).toMatchObject({ actionsOverride });
  });

  it("PATCH can replace the action list with an empty one", async () => {
    const { PATCH } = await import("@/app/api/unique-bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ actionsOverride: [] }, "minter-1"),
      makeParams({ id: "ub-1" })
    );
    expect(response.status).toBe(200);
    expect(updateUniqueBotMock).toHaveBeenCalledWith("ub-1", {
      actionsOverride: [],
    });
  });

  it("PATCH clears an actions override so the bot inherits the template list", async () => {
    const { PATCH } = await import("@/app/api/unique-bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ actionsOverride: null }, "minter-1"),
      makeParams({ id: "ub-1" })
    );
    expect(response.status).toBe(200);
    expect(updateUniqueBotMock).toHaveBeenCalledWith("ub-1", {
      actionsOverride: null,
    });
  });

  it("PATCH rejects Grid Protection as a bot action attribute", async () => {
    const { PATCH } = await import("@/app/api/unique-bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        {
          actionsOverride: [
            { name: "Weld", numberOfDice: 0, attribute: "gridProtection" },
          ],
        },
        "minter-1"
      ),
      makeParams({ id: "ub-1" })
    );
    expect(response.status).toBe(400);
    expect(updateUniqueBotMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the unique bot does not exist", async () => {
    getUniqueBotMock.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/unique-bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ nameOverride: "Pack Mule" }, "minter-1"),
      makeParams({ id: "missing" })
    );
    expect(response.status).toBe(404);
    expect(updateUniqueBotMock).not.toHaveBeenCalled();
  });

  it("refuses to clear the name or max HP of a standalone bot", async () => {
    const { PATCH } = await import("@/app/api/unique-bots/[id]/route");
    const clearedName = await invokeRoute(
      PATCH,
      makeAuthedRequest({ nameOverride: null }, "minter-1"),
      makeParams({ id: "ub-1" })
    );
    expect(clearedName.status).toBe(400);
    const clearedHp = await invokeRoute(
      PATCH,
      makeAuthedRequest({ maxHpOverride: null }, "minter-1"),
      makeParams({ id: "ub-1" })
    );
    expect(clearedHp.status).toBe(400);
    expect(updateUniqueBotMock).not.toHaveBeenCalled();
  });

  it("drops the holding's current HP when the new max is lower", async () => {
    listBotCharacterRowsByBotMock.mockResolvedValue([
      {
        id: "hold-1",
        characterId: "char-1",
        botId: "ub-1",
        sourceType: "UNIQUE",
        customName: null,
        currentHp: 9,
        maxHpBonus: 1,
        notes: null,
      },
    ]);
    const { PATCH } = await import("@/app/api/unique-bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ maxHpOverride: 4 }, "minter-1"),
      makeParams({ id: "ub-1" })
    );
    expect(response.status).toBe(200);
    expect(updateBotCharacterMock).toHaveBeenCalledWith("hold-1", {
      currentHp: 5,
    });
  });
});

describe("GET /api/unique-bots/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUniqueBotMock.mockResolvedValue(mule);
    getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "gm-1" });
    userIsInGameMock.mockResolvedValue(false);
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/unique-bots/[id]/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "ub-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns the bot to the minter", async () => {
    const { GET } = await import("@/app/api/unique-bots/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "minter-1"),
      makeParams({ id: "ub-1" })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.nameOverride).toBe("Mule");
    expect(body.ownerUserId).toBe("minter-1");
  });

  it("returns 404 when the unique bot does not exist", async () => {
    getUniqueBotMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/unique-bots/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "minter-1"),
      makeParams({ id: "missing" })
    );
    expect(response.status).toBe(404);
  });

  it("refuses a user who is not the minter, the game master, or in the game", async () => {
    const { GET } = await import("@/app/api/unique-bots/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "stranger"),
      makeParams({ id: "ub-1" })
    );
    expect(response.status).toBe(403);
  });

  it("PATCH refuses an attribute override outside -5 through +5", async () => {
    const { PATCH } = await import("@/app/api/unique-bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ processingPowerOverride: 6 }, "minter-1"),
      makeParams({ id: "ub-1" })
    );
    expect(response.status).toBe(400);
    expect(updateUniqueBotMock).not.toHaveBeenCalled();
  });

  it("PATCH drops battery used when a lower capacity override shrinks the tank", async () => {
    listBotCharacterRowsByBotMock.mockResolvedValue([
      {
        id: "hold-1",
        sourceType: "UNIQUE",
        currentHp: 8,
        maxHpBonus: 0,
        batteryUsed: 5,
        batteryUpgrade: 0,
      },
    ]);
    const { PATCH } = await import("@/app/api/unique-bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ batteryCapacityOverride: 2 }, "minter-1"),
      makeParams({ id: "ub-1" })
    );
    expect(response.status).toBe(200);
    expect(updateBotCharacterMock).toHaveBeenCalledWith("hold-1", {
      batteryUsed: 2,
    });
  });

  it("PATCH drops an Upgrade when a lower max potential override leaves it above the ceiling", async () => {
    listBotCharacterRowsByBotMock.mockResolvedValue([
      {
        id: "hold-1",
        sourceType: "UNIQUE",
        currentHp: 8,
        maxHpBonus: 0,
        processingPowerUpgrade: 4,
        batteryUsed: 0,
        batteryUpgrade: 0,
      },
    ]);
    const { PATCH } = await import("@/app/api/unique-bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ processingPowerMaxPotentialOverride: 1 }, "minter-1"),
      makeParams({ id: "ub-1" })
    );
    expect(response.status).toBe(200);
    expect(updateBotCharacterMock).toHaveBeenCalledWith("hold-1", {
      processingPowerUpgrade: 1,
    });
  });
});
