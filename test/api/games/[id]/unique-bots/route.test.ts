import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const getUniqueBotsByGameIdMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: (...args: unknown[]) => getGameMock(...args),
  userIsInGame: (...args: unknown[]) => userIsInGameMock(...args),
}));

vi.mock("@/app/lib/prisma/uniqueBot", () => ({
  getUniqueBotsByGameId: (...args: unknown[]) =>
    getUniqueBotsByGameIdMock(...args),
}));

describe("GET /api/games/[id]/unique-bots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "gm-1" });
    userIsInGameMock.mockResolvedValue(false);
    getUniqueBotsByGameIdMock.mockResolvedValue([
      { id: "ub-1", ownerUserId: "gm-1", name: "Mule", held: false },
    ]);
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/games/[id]/unique-bots/route");
    const response = await invokeRoute(
      GET,
      makeUnauthedRequest(),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when the game does not exist", async () => {
    getGameMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/games/[id]/unique-bots/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "missing" })
    );
    expect(response.status).toBe(404);
    expect(getUniqueBotsByGameIdMock).not.toHaveBeenCalled();
  });

  it("refuses a user who is not in the game", async () => {
    const { GET } = await import("@/app/api/games/[id]/unique-bots/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "stranger"),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(403);
    expect(getUniqueBotsByGameIdMock).not.toHaveBeenCalled();
  });

  it("returns the game's unique bots to a member", async () => {
    userIsInGameMock.mockResolvedValue(true);
    const { GET } = await import("@/app/api/games/[id]/unique-bots/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "player-1"),
      makeParams({ id: "game-1" })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { id: "ub-1", ownerUserId: "gm-1", name: "Mule", held: false },
    ]);
  });
});
