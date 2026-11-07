import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getCustomBotsByGameMock = vi.fn();
const createCustomBotMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: (...args: unknown[]) => getGameMock(...args),
  userIsInGame: (...args: unknown[]) => userIsInGameMock(...args),
}));

vi.mock("@/app/lib/prisma/customBot", () => ({
  getCustomBotsByGame: (...args: unknown[]) => getCustomBotsByGameMock(...args),
  createCustomBot: (...args: unknown[]) => createCustomBotMock(...args),
}));

describe("/api/games/[id]/custom-bots handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createCustomBotMock.mockImplementation(
      async (data: {
        gameId: string;
        name: string;
        maxHp: number;
        description: string | null;
        confCost: number | null;
        usage: string | null;
        notes: string | null;
        membersCanModify: boolean;
      }) => ({
        id: "cb-1",
        ...data,
      })
    );
  });

  it("POST returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/games/[id]/custom-bots/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest({ name: "Porter", maxHp: 9 }),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
    expect(createCustomBotMock).not.toHaveBeenCalled();
  });

  it("POST returns 403 when a player tries to create a Custom bot", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/games/[id]/custom-bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ name: "Porter", maxHp: 9 }, "player-1"),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(403);
    expect(createCustomBotMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 when the name is missing", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/games/[id]/custom-bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ maxHp: 9 }, "gm-1"),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(400);
    expect(createCustomBotMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 when speed is negative", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/games/[id]/custom-bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ name: "Porter", maxHp: 9, speed: -1 }, "gm-1"),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(400);
    expect(createCustomBotMock).not.toHaveBeenCalled();
  });

  it("POST creates a Custom bot with empty optional fields and members-may-modify off", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/games/[id]/custom-bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          name: "  Porter  ",
          maxHp: 9,
          description: "   ",
          usage: "",
          notes: null,
          confCost: null,
        },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: "cb-1",
      gameId: "g-1",
      name: "Porter",
      description: null,
      confCost: null,
      usage: null,
      notes: null,
      maxHp: 9,
      membersCanModify: false,
      maxCargoWeightKg: null,
      maxInstalledItems: null,
      speed: 0,
      maxCarryWeight: 0,
      heightMetres: null,
      weight: null,
    });
  });

  it("POST stores the members-may-modify flag when the GM turns it on", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/games/[id]/custom-bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        { name: "Porter", maxHp: 9, membersCanModify: true },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.membersCanModify).toBe(true);
  });

  it("POST stores a chosen speed and track base", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/games/[id]/custom-bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          name: "Porter",
          maxHp: 9,
          speed: 4,
          processingPower: 2,
          batteryCapacity: 6,
        },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(201);
    expect(createCustomBotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        speed: 4,
        processingPower: 2,
        batteryCapacity: 6,
      })
    );
    expect(await response.json()).toMatchObject({
      speed: 4,
      processingPower: 2,
      batteryCapacity: 6,
    });
  });

  it("POST stores cargo and install caps when the GM sets them", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    const { POST } = await import("@/app/api/games/[id]/custom-bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest(
        {
          name: "Porter",
          maxHp: 9,
          maxCargoWeightKg: 12.5,
          maxInstalledItems: 2,
        },
        "gm-1"
      ),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      maxCargoWeightKg: 12.5,
      maxInstalledItems: 2,
    });
    expect(createCustomBotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        maxCargoWeightKg: 12.5,
        maxInstalledItems: 2,
      })
    );
  });

  it("POST returns 404 when the game does not exist", async () => {
    getGameMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/games/[id]/custom-bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ name: "Porter", maxHp: 9 }, "gm-1"),
      makeParams({ id: "missing" })
    );

    expect(response.status).toBe(404);
    expect(createCustomBotMock).not.toHaveBeenCalled();
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/games/[id]/custom-bots/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
    expect(getCustomBotsByGameMock).not.toHaveBeenCalled();
  });

  it("GET returns 404 when the game does not exist", async () => {
    getGameMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/games/[id]/custom-bots/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "missing" })
    );

    expect(response.status).toBe(404);
    expect(getCustomBotsByGameMock).not.toHaveBeenCalled();
  });

  it("GET returns 403 when the caller is neither the GM nor a member", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    userIsInGameMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/games/[id]/custom-bots/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "stranger-1"),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(403);
    expect(getCustomBotsByGameMock).not.toHaveBeenCalled();
  });

  it("GET returns this game's Custom bots to a member", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    userIsInGameMock.mockResolvedValue(true);
    getCustomBotsByGameMock.mockResolvedValue([
      {
        id: "cb-1",
        gameId: "g-1",
        name: "Porter",
        maxHp: 9,
        membersCanModify: false,
      },
    ]);
    const { GET } = await import("@/app/api/games/[id]/custom-bots/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "player-1"),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: "cb-1",
        gameId: "g-1",
        name: "Porter",
        maxHp: 9,
        membersCanModify: false,
      },
    ]);
    expect(getCustomBotsByGameMock).toHaveBeenCalledWith("g-1");
  });
});
