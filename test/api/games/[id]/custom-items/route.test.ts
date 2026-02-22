import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getCustomItemsByGameMock = vi.fn();
const createCustomItemMock = vi.fn();
const safeParseMock = vi.fn();
const omitMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/customItem", () => ({
  getCustomItemsByGame: getCustomItemsByGameMock,
  createCustomItem: createCustomItemMock,
}));

vi.mock("@/app/lib/types/item", () => ({
  customItemCreateSchema: {
    omit: omitMock,
  },
}));

describe("/api/games/[id]/custom-items route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    omitMock.mockReturnValue({ safeParse: safeParseMock });
  });

  it("GET returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/games/[id]/custom-items/route");
    const response = await invokeRoute(GET, makeUnauthedRequest(), makeParams({ id: "g-1" }));
    expect(response.status).toBe(401);
  });

  it("GET returns 403 when user has no game access", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-2" });
    userIsInGameMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/games/[id]/custom-items/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
  });

  it("GET returns 200 for game members", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-2" });
    userIsInGameMock.mockResolvedValue(true);
    getCustomItemsByGameMock.mockResolvedValue([{ id: "c-1" }]);
    const { GET } = await import("@/app/api/games/[id]/custom-items/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ id: "c-1" }]);
  });

  it("POST returns 400 on invalid body", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    safeParseMock.mockReturnValue({
      error: { issues: [{ message: "invalid custom item" }] },
      data: undefined,
    });
    const { POST } = await import("@/app/api/games/[id]/custom-items/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ bad: true }, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(400);
  });

  it("POST returns 201 on success", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    safeParseMock.mockReturnValue({
      data: { name: "Custom Dagger", weight: 1, type: "GENERAL_ITEM" },
      error: undefined,
    });
    createCustomItemMock.mockResolvedValue({ id: "c-1" });
    const { POST } = await import("@/app/api/games/[id]/custom-items/route");

    const response = await invokeRoute(
      POST,
      makeAuthedRequest({ name: "Custom Dagger", weight: 1 }, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(201);
    expect(createCustomItemMock).toHaveBeenCalled();
  });
});
