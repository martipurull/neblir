import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const createBotMock = vi.fn();
const getBotsMock = vi.fn();
const userIsSuperAdminMock = vi.fn();

const catalogue = [
  {
    id: "bot-player",
    accessType: "PLAYER" as const,
    name: "Loader",
  },
  {
    id: "bot-gm",
    accessType: "GAME_MASTER" as const,
    name: "Black Frame",
  },
];

vi.mock("@/app/lib/authz/superAdmin", () => ({
  userIsSuperAdmin: userIsSuperAdminMock,
}));

vi.mock("@/app/lib/prisma/bot", () => ({
  createBot: createBotMock,
  getBots: getBotsMock,
}));

const officialBot = {
  accessType: "PLAYER" as const,
  name: "Loader",
  description: "A hauler frame.",
  confCost: 40,
  usage: "Follows the holder.",
  notes: "Loud.",
  maxHp: 12,
};

describe("/api/bots route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userIsSuperAdminMock.mockResolvedValue(true);
    getBotsMock.mockResolvedValue([]);
  });

  it("POST returns 401 when unauthenticated", async () => {
    const { POST } = await import("@/app/api/bots/route");
    const response = await invokeRoute(POST, makeUnauthedRequest(officialBot));
    expect(response.status).toBe(401);
    expect(createBotMock).not.toHaveBeenCalled();
  });

  it("POST returns 403 when the user is not a super-admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    const { POST } = await import("@/app/api/bots/route");
    const response = await invokeRoute(POST, makeAuthedRequest(officialBot));
    expect(response.status).toBe(403);
    expect(createBotMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 when the body is missing a name", async () => {
    const { POST } = await import("@/app/api/bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ ...officialBot, name: "  " })
    );
    expect(response.status).toBe(400);
    expect(createBotMock).not.toHaveBeenCalled();
  });

  it("POST returns 201 and stores the Official bot", async () => {
    createBotMock.mockResolvedValue({ id: "bot-1", ...officialBot });
    const { POST } = await import("@/app/api/bots/route");

    const response = await invokeRoute(POST, makeAuthedRequest(officialBot));

    expect(response.status).toBe(201);
    expect(createBotMock).toHaveBeenCalledWith(officialBot, {
      officialCatalogueWrite: true,
    });
    await expect(response.json()).resolves.toMatchObject({
      id: "bot-1",
      name: "Loader",
      maxHp: 12,
    });
  });

  it("POST stores speed, max carry, and descriptive height and weight", async () => {
    const frame = {
      ...officialBot,
      speed: 8,
      maxCarryWeight: 40,
      heightMetres: 1.7,
      weight: 90,
    };
    createBotMock.mockResolvedValue({ id: "bot-1", ...frame });
    const { POST } = await import("@/app/api/bots/route");

    const response = await invokeRoute(POST, makeAuthedRequest(frame));

    expect(response.status).toBe(201);
    expect(createBotMock).toHaveBeenCalledWith(frame, {
      officialCatalogueWrite: true,
    });
    await expect(response.json()).resolves.toMatchObject({
      speed: 8,
      maxCarryWeight: 40,
      heightMetres: 1.7,
      weight: 90,
    });
  });

  it("POST returns 400 when speed is negative", async () => {
    const { POST } = await import("@/app/api/bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ ...officialBot, speed: -1 })
    );
    expect(response.status).toBe(400);
    expect(createBotMock).not.toHaveBeenCalled();
  });

  it("POST returns 409 when the Official name matches after case and extra spaces", async () => {
    getBotsMock.mockResolvedValue([{ id: "bot-1", name: "Loader" }]);
    const { POST } = await import("@/app/api/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ ...officialBot, name: "  loader  " })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      message: "This Official name is already taken",
    });
    expect(createBotMock).not.toHaveBeenCalled();
  });

  it("POST returns 409 when a player-facing bot reuses a GM-only Official name", async () => {
    getBotsMock.mockResolvedValue([
      { id: "bot-gm", name: "Loader", accessType: "GAME_MASTER" },
    ]);
    const { POST } = await import("@/app/api/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        ...officialBot,
        accessType: "PLAYER",
        name: "Loader",
      })
    );

    expect(response.status).toBe(409);
    expect(createBotMock).not.toHaveBeenCalled();
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/bots/route");
    const response = await invokeRoute(GET, makeUnauthedRequest());
    expect(response.status).toBe(401);
    expect(getBotsMock).not.toHaveBeenCalled();
  });

  it("GET returns every Official bot to a super-admin", async () => {
    getBotsMock.mockResolvedValue(catalogue);
    const { GET } = await import("@/app/api/bots/route");

    const response = await invokeRoute(GET, makeAuthedRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(catalogue);
  });

  it("GET hides GM-only Official bots from someone who is not a super-admin", async () => {
    userIsSuperAdminMock.mockResolvedValue(false);
    getBotsMock.mockResolvedValue(catalogue);
    const { GET } = await import("@/app/api/bots/route");

    const response = await invokeRoute(GET, makeAuthedRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([catalogue[0]]);
  });

  it("POST stores attribute bases, max potentials, and battery capacity", async () => {
    const tracks = {
      processingPower: 2,
      processingPowerMaxPotential: 4,
      physicalPower: -5,
      physicalPowerMaxPotential: 0,
      finesseCapacity: 5,
      finesseCapacityMaxPotential: 5,
      gridProtection: 0,
      gridProtectionMaxPotential: 1,
      batteryCapacity: 10,
      batteryMaxPotential: 3,
    };
    createBotMock.mockResolvedValue({ id: "bot-1", ...officialBot, ...tracks });
    const { POST } = await import("@/app/api/bots/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ ...officialBot, ...tracks })
    );

    expect(response.status).toBe(201);
    expect(createBotMock).toHaveBeenCalledWith(
      { ...officialBot, ...tracks },
      { officialCatalogueWrite: true }
    );
  });

  it("POST returns 400 when Processing Power is above +5", async () => {
    const { POST } = await import("@/app/api/bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ ...officialBot, processingPower: 6 })
    );
    expect(response.status).toBe(400);
    expect(createBotMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 when battery capacity is below 1", async () => {
    const { POST } = await import("@/app/api/bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ ...officialBot, batteryCapacity: 0 })
    );
    expect(response.status).toBe(400);
    expect(createBotMock).not.toHaveBeenCalled();
  });

  it("POST returns 400 when Grid Protection upgrade potential is above +5", async () => {
    const { POST } = await import("@/app/api/bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ ...officialBot, gridProtectionMaxPotential: 6 })
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      details: expect.stringContaining(
        "Grid Protection upgrade potential must stay from 0 through +5"
      ),
    });
    expect(createBotMock).not.toHaveBeenCalled();
  });

  it("POST stores a bot action list", async () => {
    const actions = [
      {
        name: "Weld",
        description: null,
        notes: null,
        numberOfDice: 0,
        attribute: "processingPower",
        damage: null,
      },
    ];
    createBotMock.mockResolvedValue({ id: "bot-1", ...officialBot, actions });
    const { POST } = await import("@/app/api/bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ ...officialBot, actions })
    );
    expect(response.status).toBe(201);
    expect(createBotMock).toHaveBeenCalledWith(
      { ...officialBot, actions },
      { officialCatalogueWrite: true }
    );
  });

  it("POST rejects Grid Protection as a bot action attribute", async () => {
    const { POST } = await import("@/app/api/bots/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest({
        ...officialBot,
        actions: [
          {
            name: "Weld",
            numberOfDice: 0,
            attribute: "gridProtection",
          },
        ],
      })
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      details: expect.stringContaining(
        "Grid Protection is not a bot action attribute."
      ),
    });
    expect(createBotMock).not.toHaveBeenCalled();
  });
});
