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
});
