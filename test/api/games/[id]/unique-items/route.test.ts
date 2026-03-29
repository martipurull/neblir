import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getUniqueItemsByGameIdMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/uniqueItem", () => ({
  getUniqueItemsByGameId: getUniqueItemsByGameIdMock,
}));

describe("GET /api/games/[id]/unique-items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/games/[id]/unique-items/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when game does not exist", async () => {
    getGameMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/games/[id]/unique-items/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(404);
    expect(getUniqueItemsByGameIdMock).not.toHaveBeenCalled();
  });

  it("returns 403 when user is not in game", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    userIsInGameMock.mockResolvedValue(false);
    const { GET } = await import("@/app/api/games/[id]/unique-items/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
    expect(getUniqueItemsByGameIdMock).not.toHaveBeenCalled();
  });

  it("returns 200 with unique items list when user is in game", async () => {
    getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
    userIsInGameMock.mockResolvedValue(true);
    getUniqueItemsByGameIdMock.mockResolvedValue([
      { id: "u-1", name: "Unique Sword" },
      { id: "u-2", name: "Custom variant" },
    ]);
    const { GET } = await import("@/app/api/games/[id]/unique-items/route");

    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      { id: "u-1", name: "Unique Sword" },
      { id: "u-2", name: "Custom variant" },
    ]);
    expect(getUniqueItemsByGameIdMock).toHaveBeenCalledWith("g-1");
  });
});
