import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";

const getBotMock = vi.fn();
const getBotsMock = vi.fn();
const updateBotMock = vi.fn();
const userIsSuperAdminMock = vi.fn();
const listBotCharacterRowsByBotMock = vi.fn();
const updateBotCharacterMock = vi.fn();

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/bot", () => ({
  getBot: getBotMock,
  getBots: getBotsMock,
  updateBot: updateBotMock,
}));

vi.mock("@/app/lib/prisma/botCharacter", () => ({
  listBotCharacterRowsByBot: listBotCharacterRowsByBotMock,
  updateBotCharacter: updateBotCharacterMock,
}));

describe("/api/bots/[id] route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
    getBotMock.mockResolvedValue({
      id: "bot-1",
      accessType: "PLAYER",
      name: "Loader",
      description: "A hauler frame.",
      confCost: 40,
      maxHp: 12,
    });
    getBotsMock.mockResolvedValue([
      { id: "bot-1", name: "Loader" },
      { id: "bot-2", name: "Sentinel" },
    ]);
    listBotCharacterRowsByBotMock.mockResolvedValue([]);
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/bots/[id]/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "bot-1" })
    );
    expect(response.status).toBe(401);
    expect(getBotMock).not.toHaveBeenCalled();
  });

  it("GET returns 400 when the bot id is missing", async () => {
    const { GET } = await import("@/app/api/bots/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "" })
    );
    expect(response.status).toBe(400);
    expect(getBotMock).not.toHaveBeenCalled();
  });

  it("GET returns 404 when the Official bot does not exist", async () => {
    getBotMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/bots/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "missing" })
    );
    expect(response.status).toBe(404);
  });

  it("GET returns a player-facing Official bot to a signed-in user", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/bots/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "bot-1" })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: "bot-1",
      accessType: "PLAYER",
      name: "Loader",
    });
  });

  it("GET returns a GM-only Official bot to a super-admin", async () => {
    getBotMock.mockResolvedValue({
      id: "bot-gm",
      accessType: "GAME_MASTER",
      name: "Black Frame",
      description: "A quiet frame.",
      confCost: 80,
      maxHp: 16,
    });
    const { GET } = await import("@/app/api/bots/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "bot-gm" })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      accessType: "GAME_MASTER",
      name: "Black Frame",
    });
  });

  it("GET hides a GM-only Official bot from someone who is not a super-admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    getBotMock.mockResolvedValue({
      id: "bot-gm",
      accessType: "GAME_MASTER",
      name: "Black Frame",
      description: "A quiet frame.",
      confCost: 80,
      maxHp: 16,
    });
    const { GET } = await import("@/app/api/bots/[id]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(),
      makeParams({ id: "bot-gm" })
    );
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      message: "Official bot not found",
    });
  });

  it("PATCH returns 401 when unauthenticated", async () => {
    const { PATCH } = await import("@/app/api/bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeUnauthedRequest({ name: "Hauler" }),
      makeParams({ id: "bot-1" })
    );
    expect(response.status).toBe(401);
    expect(updateBotMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 403 when the user is not a super-admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { PATCH } = await import("@/app/api/bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ maxHp: 20 }),
      makeParams({ id: "bot-1" })
    );
    expect(response.status).toBe(403);
    expect(updateBotMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 200 when the Official bot is edited", async () => {
    updateBotMock.mockResolvedValue({
      id: "bot-1",
      name: "Loader",
      maxHp: 18,
      description: "A reinforced hauler.",
      confCost: 55,
      accessType: "GAME_MASTER",
    });
    const { PATCH } = await import("@/app/api/bots/[id]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({
        accessType: "GAME_MASTER",
        description: "A reinforced hauler.",
        confCost: 55,
        usage: "Stays close.",
        notes: "Quiet.",
        maxHp: 18,
      }),
      makeParams({ id: "bot-1" })
    );

    expect(response.status).toBe(200);
    expect(updateBotMock).toHaveBeenCalledWith(
      "bot-1",
      {
        accessType: "GAME_MASTER",
        description: "A reinforced hauler.",
        confCost: 55,
        usage: "Stays close.",
        notes: "Quiet.",
        maxHp: 18,
      },
      { officialCatalogueWrite: true }
    );
  });

  it("PATCH returns 200 when the bot keeps its own Official name", async () => {
    updateBotMock.mockResolvedValue({ id: "bot-1", name: "Loader" });
    const { PATCH } = await import("@/app/api/bots/[id]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "  loader  " }),
      makeParams({ id: "bot-1" })
    );

    expect(response.status).toBe(200);
    expect(updateBotMock).toHaveBeenCalled();
  });

  it("PATCH returns 409 when the new Official name collides with another bot", async () => {
    const { PATCH } = await import("@/app/api/bots/[id]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "sentinel" }),
      makeParams({ id: "bot-1" })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      message: "This Official name is already taken",
    });
    expect(updateBotMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 400 when max HP is below 1", async () => {
    const { PATCH } = await import("@/app/api/bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ maxHp: 0 }),
      makeParams({ id: "bot-1" })
    );
    expect(response.status).toBe(400);
    expect(updateBotMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 400 when the bot id is missing", async () => {
    const { PATCH } = await import("@/app/api/bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "Hauler" }),
      makeParams({ id: "" })
    );
    expect(response.status).toBe(400);
    expect(updateBotMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 404 when the Official bot does not exist", async () => {
    getBotMock.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "Hauler" }),
      makeParams({ id: "missing" })
    );
    expect(response.status).toBe(404);
    expect(updateBotMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 400 when a lower max HP would make a holding's effective max negative", async () => {
    listBotCharacterRowsByBotMock.mockResolvedValue([
      {
        id: "hold-1",
        characterId: "char-1",
        botId: "bot-1",
        customName: null,
        currentHp: 4,
        maxHpBonus: -8,
        notes: null,
      },
    ]);
    const { PATCH } = await import("@/app/api/bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ maxHp: 6 }),
      makeParams({ id: "bot-1" })
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: "Effective max HP must be at least 0.",
    });
    expect(updateBotMock).not.toHaveBeenCalled();
    expect(updateBotCharacterMock).not.toHaveBeenCalled();
  });

  it("PATCH clamps a holding's current HP when the Official max HP drops", async () => {
    listBotCharacterRowsByBotMock.mockResolvedValue([
      {
        id: "hold-over",
        characterId: "char-1",
        botId: "bot-1",
        customName: null,
        currentHp: 12,
        maxHpBonus: 0,
        notes: null,
      },
      {
        id: "hold-under",
        characterId: "char-2",
        botId: "bot-1",
        customName: null,
        currentHp: 3,
        maxHpBonus: 2,
        notes: null,
      },
    ]);
    updateBotMock.mockResolvedValue({
      id: "bot-1",
      name: "Loader",
      maxHp: 4,
    });
    const { PATCH } = await import("@/app/api/bots/[id]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ maxHp: 4 }),
      makeParams({ id: "bot-1" })
    );
    expect(response.status).toBe(200);
    expect(updateBotCharacterMock).toHaveBeenCalledTimes(1);
    expect(updateBotCharacterMock).toHaveBeenCalledWith("hold-over", {
      currentHp: 4,
    });
  });
});
