import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../../helpers";

const getGameInvitesForUserMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGameInvitesForUser: getGameInvitesForUserMock,
}));

describe("/api/games/invites GET (my game invites)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    const { GET } = await import("@/app/api/games/invites/route");
    const response = await invokeRoute(GET, makeUnauthedRequest());
    expect(response.status).toBe(401);
  });

  it("returns 200 with empty array when user has no invites", async () => {
    getGameInvitesForUserMock.mockResolvedValue([]);
    const { GET } = await import("@/app/api/games/invites/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1")
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([]);
  });

  it("returns 200 with invites when user has pending invites", async () => {
    getGameInvitesForUserMock.mockResolvedValue([
      {
        gameId: "g-1",
        game: { id: "g-1", name: "Campaign One" },
        invitedBy: { id: "gm-1", name: "Alice" },
        createdAt: new Date("2025-01-01"),
      },
    ]);
    const { GET } = await import("@/app/api/games/invites/route");
    const response = await invokeRoute(
      GET,
      makeAuthedRequest(undefined, "user-1")
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      gameId: "g-1",
      gameName: "Campaign One",
      invitedByName: "Alice",
    });
  });
});
