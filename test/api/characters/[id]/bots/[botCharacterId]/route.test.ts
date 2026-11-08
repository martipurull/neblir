import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const playControlMock = vi.fn();
const getBotMock = vi.fn();
const getCustomBotMock = vi.fn();
const getBotCharacterRowMock = vi.fn();
const updateBotCharacterMock = vi.fn();
const resolveUniqueBotTemplateMock = vi.fn();

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  userHasPlayControl: (...args: unknown[]) => playControlMock(...args),
}));

vi.mock("@/app/lib/prisma/bot", () => ({
  getBot: (...args: unknown[]) => getBotMock(...args),
}));

vi.mock("@/app/lib/prisma/customBot", () => ({
  getCustomBot: (...args: unknown[]) => getCustomBotMock(...args),
}));

vi.mock("@/app/lib/prisma/botPlacement", () => ({
  placementsForHoldings: async () => new Map(),
  placementsByHolding: async () => new Map(),
  botHoldingHasPlacements: async () => false,
}));

vi.mock("@/app/lib/prisma/uniqueBot", () => ({
  resolveUniqueBotTemplate: (...args: unknown[]) =>
    resolveUniqueBotTemplateMock(...args),
}));

vi.mock("@/app/lib/prisma/botCharacter", async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    getBotCharacterRow: (...args: unknown[]) => getBotCharacterRowMock(...args),
    updateBotCharacter: (...args: unknown[]) => updateBotCharacterMock(...args),
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
  maxHp: 10,
};

const holding = {
  id: "hold-1",
  characterId: "char-1",
  botId: "bot-1",
  customName: null as string | null,
  currentHp: 10,
  maxHpBonus: 0,
  notes: null as string | null,
};

describe("/api/characters/[id]/bots/[botCharacterId] handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    playControlMock.mockResolvedValue(true);
    getBotMock.mockResolvedValue(loader);
    getBotCharacterRowMock.mockResolvedValue(holding);
    updateBotCharacterMock.mockImplementation(
      async (_id: string, data: Partial<typeof holding>) => ({
        ...holding,
        ...data,
      })
    );
  });

  const params = () => makeParams({ id: "char-1", botCharacterId: "hold-1" });

  it("PATCH returns 401 when unauthenticated", async () => {
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");
    const response = await invokeRoute(
      PATCH,
      makeUnauthedRequest({ action: "setHp", currentHp: 4 }),
      params()
    );
    expect(response.status).toBe(401);
    expect(updateBotCharacterMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 400 when the body is not a holding update", async () => {
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setHp" }, "user-1"),
      params()
    );
    expect(response.status).toBe(400);
    expect(updateBotCharacterMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 404 when the holding does not belong to the character", async () => {
    getBotCharacterRowMock.mockResolvedValue(null);
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setHp", currentHp: 4 }, "user-1"),
      params()
    );
    expect(response.status).toBe(404);
    expect(updateBotCharacterMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 403 when the user lacks play control", async () => {
    playControlMock.mockResolvedValue(false);
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setHp", currentHp: 4 }, "user-1"),
      params()
    );

    expect(response.status).toBe(403);
    expect(updateBotCharacterMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 400 when current HP is above the effective max", async () => {
    getBotCharacterRowMock.mockResolvedValue({ ...holding, maxHpBonus: 2 });
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setHp", currentHp: 13 }, "user-1"),
      params()
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: "Current HP must stay from 0 through the effective max.",
    });
    expect(updateBotCharacterMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 400 when current HP is below 0", async () => {
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setHp", currentHp: -1 }, "user-1"),
      params()
    );

    expect(response.status).toBe(400);
    expect(updateBotCharacterMock).not.toHaveBeenCalled();
  });

  it("PATCH marks the holding Broken at 0 HP and Operational above 0", async () => {
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const broken = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setHp", currentHp: 0 }, "user-1"),
      params()
    );
    expect(broken.status).toBe(200);
    await expect(broken.json()).resolves.toMatchObject({
      currentHp: 0,
      condition: "BROKEN",
      effectiveMaxHp: 10,
    });

    const operational = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setHp", currentHp: 1 }, "user-1"),
      params()
    );
    expect(operational.status).toBe(200);
    await expect(operational.json()).resolves.toMatchObject({
      currentHp: 1,
      condition: "OPERATIONAL",
    });
  });

  it("PATCH sets the nickname, holding notes, and max HP bonus", async () => {
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const named = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "setCustomName", customName: "  Rex  " },
        "user-1"
      ),
      params()
    );
    expect(named.status).toBe(200);
    await expect(named.json()).resolves.toMatchObject({
      customName: "Rex",
      displayName: "Rex",
    });

    updateBotCharacterMock.mockImplementation(
      async (_id: string, data: Partial<typeof holding>) => ({
        ...holding,
        customName: null,
        ...data,
      })
    );
    const cleared = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "setCustomName", customName: "   " },
        "user-1"
      ),
      params()
    );
    await expect(cleared.json()).resolves.toMatchObject({
      customName: null,
      displayName: "Loader",
    });

    const noted = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "setNotes", notes: "Scratched chassis." },
        "user-1"
      ),
      params()
    );
    await expect(noted.json()).resolves.toMatchObject({
      notes: "Scratched chassis.",
    });

    const bonus = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setMaxHpBonus", maxHpBonus: 4 }, "user-1"),
      params()
    );
    expect(bonus.status).toBe(200);
    await expect(bonus.json()).resolves.toMatchObject({
      maxHpBonus: 4,
      effectiveMaxHp: 14,
      currentHp: 10,
      condition: "OPERATIONAL",
    });
  });

  it("PATCH keeps current HP inside the new effective max when the bonus shrinks", async () => {
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setMaxHpBonus", maxHpBonus: -6 }, "user-1"),
      params()
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      maxHpBonus: -6,
      effectiveMaxHp: 4,
      currentHp: 4,
      condition: "OPERATIONAL",
    });
    expect(updateBotCharacterMock).toHaveBeenCalledWith("hold-1", {
      maxHpBonus: -6,
      currentHp: 4,
    });
  });

  it("PATCH reads the Custom bot template when the holding is custom", async () => {
    getBotCharacterRowMock.mockResolvedValue({
      ...holding,
      botId: "cb-1",
      sourceType: "CUSTOM",
      currentHp: 9,
    });
    getCustomBotMock.mockResolvedValue({
      id: "cb-1",
      name: "Hauler",
      description: null,
      confCost: null,
      usage: null,
      notes: null,
      maxHp: 20,
    });
    updateBotCharacterMock.mockImplementation(
      async (_id: string, data: Partial<typeof holding>) => ({
        ...holding,
        botId: "cb-1",
        sourceType: "CUSTOM",
        currentHp: 9,
        ...data,
      })
    );
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setHp", currentHp: 15 }, "user-1"),
      params()
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      displayName: "Hauler",
      currentHp: 15,
      effectiveMaxHp: 20,
      condition: "OPERATIONAL",
    });
    expect(getCustomBotMock).toHaveBeenCalledWith("cb-1");
    expect(getBotMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 404 when the Custom bot template is missing", async () => {
    getBotCharacterRowMock.mockResolvedValue({
      ...holding,
      botId: "cb-1",
      sourceType: "CUSTOM",
    });
    getCustomBotMock.mockResolvedValue(null);
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setHp", currentHp: 4 }, "user-1"),
      params()
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      message: "Custom bot not found",
    });
    expect(updateBotCharacterMock).not.toHaveBeenCalled();
    expect(getBotMock).not.toHaveBeenCalled();
  });

  it("PATCH lets play control change HP on a unique holding", async () => {
    getBotCharacterRowMock.mockResolvedValue({
      ...holding,
      botId: "ub-1",
      sourceType: "UNIQUE",
      currentHp: 8,
    });
    resolveUniqueBotTemplateMock.mockResolvedValue({
      id: "ub-1",
      name: "Mule",
      maxHp: 8,
      gameId: "g-1",
      ownerUserId: "minter-1",
    });
    updateBotCharacterMock.mockImplementation(
      async (_id: string, data: Partial<typeof holding>) => ({
        ...holding,
        botId: "ub-1",
        sourceType: "UNIQUE",
        currentHp: 8,
        ...data,
      })
    );
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setHp", currentHp: 3 }, "grantee"),
      params()
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      displayName: "Mule",
      currentHp: 3,
      effectiveMaxHp: 8,
    });
    expect(getBotMock).not.toHaveBeenCalled();
    expect(resolveUniqueBotTemplateMock).toHaveBeenCalledWith("ub-1");
  });

  it("PATCH shows the effective attribute and the signed Upgrade", async () => {
    getBotMock.mockResolvedValue({
      ...loader,
      processingPower: 5,
      processingPowerMaxPotential: 5,
    });
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "setUpgrade", track: "processingPower", upgrade: 5 },
        "user-1"
      ),
      params()
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      attributes: {
        processingPower: {
          base: 5,
          upgrade: 5,
          effective: 10,
          signedUpgrade: "+5",
        },
      },
    });
    expect(updateBotCharacterMock).toHaveBeenCalledWith("hold-1", {
      processingPowerUpgrade: 5,
    });
  });

  it("PATCH shows the base alone when the Upgrade is 0", async () => {
    getBotMock.mockResolvedValue({
      ...loader,
      processingPower: 2,
      processingPowerMaxPotential: 4,
    });
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "setUpgrade", track: "processingPower", upgrade: 0 },
        "user-1"
      ),
      params()
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      attributes: {
        processingPower: {
          base: 2,
          effective: 2,
          signedUpgrade: null,
        },
      },
    });
  });

  it("PATCH refuses an Upgrade outside -5 through that track's upgrade potential", async () => {
    getBotMock.mockResolvedValue({
      ...loader,
      processingPower: 2,
      processingPowerMaxPotential: 2,
    });
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const tooHigh = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "setUpgrade", track: "processingPower", upgrade: 3 },
        "user-1"
      ),
      params()
    );
    expect(tooHigh.status).toBe(400);
    await expect(tooHigh.json()).resolves.toMatchObject({
      message:
        "Upgrade must stay from -5 through that track's upgrade potential.",
    });

    const tooLow = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "setUpgrade", track: "processingPower", upgrade: -6 },
        "user-1"
      ),
      params()
    );
    expect(tooLow.status).toBe(400);
    await expect(tooLow.json()).resolves.toMatchObject({
      message:
        "Upgrade must stay from -5 through that track's upgrade potential.",
    });
    expect(updateBotCharacterMock).not.toHaveBeenCalled();
  });

  it("PATCH refuses battery used above the effective capacity", async () => {
    getBotMock.mockResolvedValue({
      ...loader,
      batteryCapacity: 4,
      batteryMaxPotential: 0,
    });
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setBatteryUsed", batteryUsed: 5 }, "user-1"),
      params()
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: "Battery used must stay from 0 through the effective capacity.",
    });
    expect(updateBotCharacterMock).not.toHaveBeenCalled();
  });

  it("PATCH marks the bot unable to roll when battery used reaches capacity", async () => {
    getBotMock.mockResolvedValue({
      ...loader,
      batteryCapacity: 4,
      batteryMaxPotential: 0,
    });
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setBatteryUsed", batteryUsed: 4 }, "user-1"),
      params()
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      battery: { used: 4, remaining: 0, effectiveCapacity: 4 },
      mayRoll: false,
      rollBlockedReason: "BATTERY_EMPTY",
      condition: "OPERATIONAL",
    });
  });

  it("PATCH drops battery used when the battery Upgrade shrinks capacity below it", async () => {
    getBotMock.mockResolvedValue({
      ...loader,
      batteryCapacity: 4,
      batteryMaxPotential: 5,
    });
    getBotCharacterRowMock.mockResolvedValue({ ...holding, batteryUsed: 3 });
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "setUpgrade", track: "battery", upgrade: -5 },
        "user-1"
      ),
      params()
    );

    expect(response.status).toBe(200);
    expect(updateBotCharacterMock).toHaveBeenCalledWith("hold-1", {
      batteryUpgrade: -5,
      batteryUsed: 0,
    });
    await expect(response.json()).resolves.toMatchObject({
      battery: {
        effectiveCapacity: 0,
        used: 0,
        remaining: 0,
        signedUpgrade: "-5",
      },
    });
  });

  it("PATCH keeps Beyond repair until the flag is cleared, even after healing", async () => {
    const flagged = { ...holding, isBeyondRepair: true, currentHp: 0 };
    getBotCharacterRowMock.mockResolvedValue(flagged);
    updateBotCharacterMock.mockImplementation(
      async (_id: string, data: Partial<typeof flagged>) => ({
        ...flagged,
        ...data,
      })
    );
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const healed = await invokeRoute(
      PATCH,
      makeAuthedRequest({ action: "setHp", currentHp: 4 }, "user-1"),
      params()
    );
    expect(healed.status).toBe(200);
    await expect(healed.json()).resolves.toMatchObject({
      currentHp: 4,
      condition: "BEYOND_REPAIR",
      mayRoll: false,
      rollBlockedReason: "BEYOND_REPAIR",
    });

    const cleared = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "setBeyondRepair", isBeyondRepair: false },
        "user-1"
      ),
      params()
    );
    expect(cleared.status).toBe(200);
    await expect(cleared.json()).resolves.toMatchObject({
      condition: "BROKEN",
      isBeyondRepair: false,
      rollBlockedReason: "BROKEN",
    });
  });

  it("PATCH reports Broken before an empty battery when HP is 0", async () => {
    const broken = {
      ...holding,
      currentHp: 0,
      batteryUsed: 1,
      isBeyondRepair: false,
    };
    getBotMock.mockResolvedValue({
      ...loader,
      batteryCapacity: 1,
      batteryMaxPotential: 0,
    });
    getBotCharacterRowMock.mockResolvedValue(broken);
    updateBotCharacterMock.mockImplementation(
      async (_id: string, data: Partial<typeof broken>) => ({
        ...broken,
        ...data,
      })
    );
    const { PATCH } =
      await import("@/app/api/characters/[id]/bots/[botCharacterId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { action: "setBeyondRepair", isBeyondRepair: false },
        "user-1"
      ),
      params()
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      condition: "BROKEN",
      mayRoll: false,
      rollBlockedReason: "BROKEN",
      battery: { remaining: 0 },
    });
  });
});
