import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const playControlMock = vi.fn();
const getBotMock = vi.fn();
const getBotCharacterRowMock = vi.fn();
const updateBotCharacterMock = vi.fn();

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  userHasPlayControl: (...args: unknown[]) => playControlMock(...args),
}));

vi.mock("@/app/lib/prisma/bot", () => ({
  getBot: (...args: unknown[]) => getBotMock(...args),
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
});
