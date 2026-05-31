import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const userIsGameMasterMock = vi.fn();
const removePlayerFromGameMock = vi.fn();
const getGameWithDetailsMock = vi.fn();
const shapeGameForResponseMock = vi.fn();

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  userIsGameMaster: userIsGameMasterMock,
}));

vi.mock("@/app/lib/prisma/gameMembership", () => ({
  removePlayerFromGame: removePlayerFromGameMock,
}));

vi.mock("@/app/lib/prisma/game", () => ({
  getGameWithDetails: getGameWithDetailsMock,
}));

vi.mock("@/app/lib/gameDetailResponse", () => ({
  shapeGameForResponse: shapeGameForResponseMock,
}));

describe("DELETE /api/games/[id]/users/[userId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { DELETE } =
      await import("@/app/api/games/[id]/users/[userId]/route");
    const response = await invokeRoute(
      DELETE,
      makeUnauthedRequest(),
      makeParams({ id: "g-1", userId: "u-1" })
    );
    expect(response.status).toBe(401);
  });

  it("returns 403 when requester is not GM", async () => {
    userIsGameMasterMock.mockResolvedValue(false);
    const { DELETE } =
      await import("@/app/api/games/[id]/users/[userId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "user-1"),
      makeParams({ id: "g-1", userId: "u-2" })
    );
    expect(response.status).toBe(403);
    expect(removePlayerFromGameMock).not.toHaveBeenCalled();
  });

  it("returns 400 when trying to remove the game master", async () => {
    userIsGameMasterMock.mockResolvedValue(true);
    removePlayerFromGameMock.mockResolvedValue({
      ok: false,
      reason: "cannot_remove_gm",
    });
    const { DELETE } =
      await import("@/app/api/games/[id]/users/[userId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1", userId: "gm-1" })
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when user is not in the game", async () => {
    userIsGameMasterMock.mockResolvedValue(true);
    removePlayerFromGameMock.mockResolvedValue({
      ok: false,
      reason: "not_in_game",
    });
    const { DELETE } =
      await import("@/app/api/games/[id]/users/[userId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1", userId: "u-2" })
    );
    expect(response.status).toBe(404);
  });

  it("returns updated game when player is removed", async () => {
    userIsGameMasterMock.mockResolvedValue(true);
    removePlayerFromGameMock.mockResolvedValue({
      ok: true,
      removedCharacterIds: ["c-1", "c-2"],
    });
    getGameWithDetailsMock.mockResolvedValue({ id: "g-1" });
    shapeGameForResponseMock.mockReturnValue({ id: "g-1", name: "Test" });

    const { DELETE } =
      await import("@/app/api/games/[id]/users/[userId]/route");
    const response = await invokeRoute(
      DELETE,
      makeAuthedRequest(undefined, "gm-1"),
      makeParams({ id: "g-1", userId: "u-2" })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      success: boolean;
      removedUserId: string;
      removedCharacterIds: string[];
      game: { id: string };
    };
    expect(body.success).toBe(true);
    expect(body.removedUserId).toBe("u-2");
    expect(body.removedCharacterIds).toEqual(["c-1", "c-2"]);
    expect(body.game.id).toBe("g-1");
    expect(removePlayerFromGameMock).toHaveBeenCalledWith("g-1", "u-2");
  });
});
