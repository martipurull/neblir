import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameWithDetailsMock = vi.fn();
const resetReactionsForGameMock = vi.fn();
const shapeGameForResponseMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGameWithDetails: getGameWithDetailsMock,
}));

vi.mock("@/app/lib/prisma/resetGameReactions", () => ({
  resetReactionsForGame: resetReactionsForGameMock,
}));

vi.mock("@/app/lib/gameDetailResponse", () => ({
  shapeGameForResponse: shapeGameForResponseMock,
}));

describe("POST /api/games/[id]/combat/reset-reactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseGame = {
    id: "g-1",
    gameMaster: "gm-1",
    name: "Game",
    users: [],
    characters: [],
    customItems: [],
    enemyInstances: [],
    initiativeOrder: [],
  };

  it("returns 401 when unauthenticated", async () => {
    const { POST } =
      await import("@/app/api/games/[id]/combat/reset-reactions/route");
    const response = await invokeRoute(
      POST,
      makeUnauthedRequest(),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(401);
    expect(resetReactionsForGameMock).not.toHaveBeenCalled();
  });

  it("returns 404 when game is not found", async () => {
    getGameWithDetailsMock.mockResolvedValue(null);
    const { POST } =
      await import("@/app/api/games/[id]/combat/reset-reactions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(404);
    expect(resetReactionsForGameMock).not.toHaveBeenCalled();
  });

  it("returns 403 when caller is not game master", async () => {
    getGameWithDetailsMock.mockResolvedValue(baseGame);
    const { POST } =
      await import("@/app/api/games/[id]/combat/reset-reactions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "g-1" })
    );
    expect(response.status).toBe(403);
    expect(resetReactionsForGameMock).not.toHaveBeenCalled();
  });

  it("resets reactions for the game when game master", async () => {
    getGameWithDetailsMock
      .mockResolvedValueOnce(baseGame)
      .mockResolvedValueOnce(baseGame);
    resetReactionsForGameMock.mockResolvedValue(undefined);
    shapeGameForResponseMock.mockReturnValue({
      id: "g-1",
      name: "Game",
      isGameMaster: true,
    });

    const { POST } =
      await import("@/app/api/games/[id]/combat/reset-reactions/route");
    const response = await invokeRoute(
      POST,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1" })
    );

    expect(response.status).toBe(200);
    expect(resetReactionsForGameMock).toHaveBeenCalledWith("g-1");
    expect(shapeGameForResponseMock).toHaveBeenCalledWith(baseGame, "gm-1");
    const body = await response.json();
    expect(body.id).toBe("g-1");
  });
});
