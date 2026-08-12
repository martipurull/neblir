import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameWithDetailsMock = vi.fn();
const resetReactionsForInitiativeOrderMock = vi.fn();
const shapeGameForResponseMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGameWithDetails: getGameWithDetailsMock,
}));

vi.mock("@/app/lib/prisma/resetInitiativeReactions", () => ({
  resetReactionsForInitiativeOrder: resetReactionsForInitiativeOrderMock,
}));

vi.mock("@/app/lib/gameDetailResponse", () => ({
  shapeGameForResponse: shapeGameForResponseMock,
}));

describe("POST /api/games/[id]/combat/reset-reactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const initiativeOrder = [
    {
      combatantType: "CHARACTER" as const,
      combatantId: "c-1",
      combatantName: "Hero",
      rolledValue: 10,
      initiativeModifier: 2,
      submittedAt: new Date(),
    },
    {
      combatantType: "ENEMY" as const,
      combatantId: "ei-1",
      combatantName: "Goblin",
      rolledValue: 8,
      initiativeModifier: 0,
      submittedAt: new Date(),
    },
  ];

  const baseGame = {
    id: "g-1",
    gameMaster: "gm-1",
    name: "Game",
    users: [],
    characters: [],
    customItems: [],
    enemyInstances: [],
    initiativeOrder,
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
    expect(resetReactionsForInitiativeOrderMock).not.toHaveBeenCalled();
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
    expect(resetReactionsForInitiativeOrderMock).not.toHaveBeenCalled();
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
    expect(resetReactionsForInitiativeOrderMock).not.toHaveBeenCalled();
  });

  it("resets reactions for initiative combatants when game master", async () => {
    getGameWithDetailsMock
      .mockResolvedValueOnce(baseGame)
      .mockResolvedValueOnce(baseGame);
    resetReactionsForInitiativeOrderMock.mockResolvedValue(undefined);
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
    expect(resetReactionsForInitiativeOrderMock).toHaveBeenCalledWith(
      "g-1",
      initiativeOrder
    );
    expect(shapeGameForResponseMock).toHaveBeenCalledWith(baseGame, "gm-1");
    const body = await response.json();
    expect(body.id).toBe("g-1");
  });

  it("passes an empty initiative order through when none exist", async () => {
    const emptyGame = { ...baseGame, initiativeOrder: [] };
    getGameWithDetailsMock
      .mockResolvedValueOnce(emptyGame)
      .mockResolvedValueOnce(emptyGame);
    resetReactionsForInitiativeOrderMock.mockResolvedValue(undefined);
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
    expect(resetReactionsForInitiativeOrderMock).toHaveBeenCalledWith(
      "g-1",
      []
    );
  });
});
