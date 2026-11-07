import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getCustomBotMock = vi.fn();
const updateCustomBotMock = vi.fn();
const listBotCharacterRowsByBotMock = vi.fn();
const updateBotCharacterMock = vi.fn();
const listUniqueBotsForTemplateMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: (...args: unknown[]) => getGameMock(...args),
  userIsInGame: (...args: unknown[]) => userIsInGameMock(...args),
}));

vi.mock("@/app/lib/prisma/customBot", () => ({
  getCustomBot: (...args: unknown[]) => getCustomBotMock(...args),
  updateCustomBot: (...args: unknown[]) => updateCustomBotMock(...args),
}));

vi.mock("@/app/lib/prisma/botCharacter", () => ({
  listBotCharacterRowsByBot: (...args: unknown[]) =>
    listBotCharacterRowsByBotMock(...args),
  updateBotCharacter: (...args: unknown[]) => updateBotCharacterMock(...args),
}));

vi.mock("@/app/lib/prisma/uniqueBot", () => ({
  listUniqueBotsForTemplate: (...args: unknown[]) =>
    listUniqueBotsForTemplateMock(...args),
}));

const porter = {
  id: "cb-1",
  gameId: "g-1",
  name: "Porter",
  description: null,
  confCost: null,
  usage: null,
  notes: null,
  maxHp: 9,
  membersCanModify: false,
};

describe("/api/games/[id]/custom-bots/[botId] handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    getCustomBotMock.mockResolvedValue(porter);
    listBotCharacterRowsByBotMock.mockResolvedValue([]);
    listUniqueBotsForTemplateMock.mockResolvedValue([]);
    updateBotCharacterMock.mockResolvedValue(undefined);
    updateCustomBotMock.mockImplementation(
      async (_id: string, data: Partial<typeof porter>) => ({
        ...porter,
        ...data,
      })
    );
  });

  const params = () => makeParams({ id: "g-1", botId: "cb-1" });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } =
      await import("@/app/api/games/[id]/custom-bots/[botId]/route");
    const response = await invokeRoute(GET, makeUnauthedRequest(), params());
    expect(response.status).toBe(401);
    expect(getCustomBotMock).not.toHaveBeenCalled();
  });

  it("GET returns 403 when the caller is neither the GM nor a member", async () => {
    userIsInGameMock.mockResolvedValue(false);
    const { GET } =
      await import("@/app/api/games/[id]/custom-bots/[botId]/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "stranger"),
      params()
    );
    expect(response.status).toBe(403);
    expect(getCustomBotMock).not.toHaveBeenCalled();
  });

  it("GET returns the Custom bot to a game member", async () => {
    userIsInGameMock.mockResolvedValue(true);
    const { GET } =
      await import("@/app/api/games/[id]/custom-bots/[botId]/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "player-1"),
      params()
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: "cb-1",
      gameId: "g-1",
      name: "Porter",
      maxHp: 9,
    });
  });

  it("GET returns 404 when the Custom bot belongs to another game", async () => {
    userIsInGameMock.mockResolvedValue(true);
    getCustomBotMock.mockResolvedValue({ ...porter, gameId: "g-2" });
    const { GET } =
      await import("@/app/api/games/[id]/custom-bots/[botId]/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "player-1"),
      params()
    );

    expect(response.status).toBe(404);
  });

  it("PATCH returns 403 when a player edits the Custom bot", async () => {
    const { PATCH } =
      await import("@/app/api/games/[id]/custom-bots/[botId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "Hauler", maxHp: 20 }, "player-1"),
      params()
    );

    expect(response.status).toBe(403);
    expect(updateCustomBotMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 404 when the Custom bot belongs to another game", async () => {
    getCustomBotMock.mockResolvedValue({ ...porter, gameId: "g-2" });
    const { PATCH } =
      await import("@/app/api/games/[id]/custom-bots/[botId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "Hauler" }, "gm-1"),
      params()
    );

    expect(response.status).toBe(404);
    expect(updateCustomBotMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 401 when unauthenticated", async () => {
    const { PATCH } =
      await import("@/app/api/games/[id]/custom-bots/[botId]/route");
    const response = await invokeRoute(
      PATCH,
      makeUnauthedRequest({ name: "Hauler" }),
      params()
    );
    expect(response.status).toBe(401);
    expect(updateCustomBotMock).not.toHaveBeenCalled();
  });

  it("PATCH returns 400 when max HP is below 1", async () => {
    const { PATCH } =
      await import("@/app/api/games/[id]/custom-bots/[botId]/route");
    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ maxHp: 0 }, "gm-1"),
      params()
    );
    expect(response.status).toBe(400);
    expect(updateCustomBotMock).not.toHaveBeenCalled();
  });

  it("PATCH saves a new name and max HP", async () => {
    const { PATCH } =
      await import("@/app/api/games/[id]/custom-bots/[botId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ name: "Hauler", maxHp: 20 }, "gm-1"),
      params()
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: "cb-1",
      gameId: "g-1",
      name: "Hauler",
      maxHp: 20,
      membersCanModify: false,
    });
  });

  it("PATCH saves cargo and install caps, including clearing them", async () => {
    const { PATCH } =
      await import("@/app/api/games/[id]/custom-bots/[botId]/route");

    const capped = await invokeRoute(
      PATCH,
      makeAuthedRequest({ maxCargoWeightKg: 8, maxInstalledItems: 1 }, "gm-1"),
      params()
    );
    expect(capped.status).toBe(200);
    expect(await capped.json()).toMatchObject({
      maxCargoWeightKg: 8,
      maxInstalledItems: 1,
    });

    const cleared = await invokeRoute(
      PATCH,
      makeAuthedRequest(
        { maxCargoWeightKg: null, maxInstalledItems: null },
        "gm-1"
      ),
      params()
    );
    expect(cleared.status).toBe(200);
    expect(await cleared.json()).toMatchObject({
      maxCargoWeightKg: null,
      maxInstalledItems: null,
    });
  });

  it("PATCH drops battery used when a lower capacity shrinks the tank", async () => {
    listBotCharacterRowsByBotMock.mockImplementation(async (id: string) => {
      if (id === "cb-1") {
        return [
          {
            id: "hold-custom",
            sourceType: "CUSTOM",
            batteryUsed: 5,
            batteryUpgrade: 0,
          },
          {
            id: "hold-other",
            sourceType: "OFFICIAL",
            batteryUsed: 5,
            batteryUpgrade: 0,
          },
        ];
      }
      if (id === "ub-1") {
        return [
          {
            id: "hold-unique",
            sourceType: "UNIQUE",
            batteryUsed: 5,
            batteryUpgrade: 0,
          },
        ];
      }
      return [];
    });
    listUniqueBotsForTemplateMock.mockResolvedValue([
      { id: "ub-1", batteryCapacityOverride: null },
      { id: "ub-own", batteryCapacityOverride: 8 },
    ]);
    const { PATCH } =
      await import("@/app/api/games/[id]/custom-bots/[botId]/route");

    const response = await invokeRoute(
      PATCH,
      makeAuthedRequest({ batteryCapacity: 2 }, "gm-1"),
      params()
    );

    expect(response.status).toBe(200);
    expect(updateBotCharacterMock).toHaveBeenCalledWith("hold-custom", {
      batteryUsed: 2,
    });
    expect(updateBotCharacterMock).toHaveBeenCalledWith("hold-unique", {
      batteryUsed: 2,
    });
    expect(updateBotCharacterMock).not.toHaveBeenCalledWith(
      "hold-other",
      expect.anything()
    );
    expect(listBotCharacterRowsByBotMock).not.toHaveBeenCalledWith("ub-own");
  });
});
