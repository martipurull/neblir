import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameMock = vi.fn();
const getPendingInvitesForGameMock = vi.fn();
const userIsInGameMock = vi.fn();
const hasPendingInviteMock = vi.fn();
const createGameInvitesMock = vi.fn();
const getUserByEmailMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  getPendingInvitesForGame: getPendingInvitesForGameMock,
  userIsInGame: userIsInGameMock,
  hasPendingInvite: hasPendingInviteMock,
  createGameInvites: createGameInvitesMock,
}));

vi.mock("@/app/lib/prisma/user", () => ({
  getUserByEmail: getUserByEmailMock,
}));

describe("/api/games/[id]/invites handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET (list pending invites for game - GM only)", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } = await import("@/app/api/games/[id]/invites/route");
      const response = await invokeRoute(
        GET,
        makeUnauthedRequest(),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 404 when game does not exist", async () => {
      getGameMock.mockResolvedValue(null);
      const { GET } = await import("@/app/api/games/[id]/invites/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 403 when user is not game master", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      const { GET } = await import("@/app/api/games/[id]/invites/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "user-2"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
    });

    it("returns 200 with pending invites when user is GM", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      getPendingInvitesForGameMock.mockResolvedValue([
        {
          invitedUserId: "u-1",
          invitedUser: { name: "Bob", email: "bob@example.com" },
          createdAt: new Date("2025-01-01"),
        },
      ]);
      const { GET } = await import("@/app/api/games/[id]/invites/route");
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({
        invitedUserId: "u-1",
        invitedUserName: "Bob",
        invitedUserEmail: "bob@example.com",
      });
    });
  });

  describe("POST (create invites - GM only)", () => {
    it("returns 401 when unauthenticated", async () => {
      const { POST } = await import("@/app/api/games/[id]/invites/route");
      const response = await invokeRoute(
        POST,
        makeUnauthedRequest({ emails: ["a@b.com"] }),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 for invalid game id", async () => {
      const { POST } = await import("@/app/api/games/[id]/invites/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ emails: ["a@b.com"] }, "gm-1"),
        makeParams({ id: "" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 404 when game does not exist", async () => {
      getGameMock.mockResolvedValue(null);
      const { POST } = await import("@/app/api/games/[id]/invites/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ emails: ["a@b.com"] }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 403 when user is not game master", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      const { POST } = await import("@/app/api/games/[id]/invites/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ emails: ["a@b.com"] }, "user-2"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
    });

    it("returns 400 when emails payload is invalid", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      const { POST } = await import("@/app/api/games/[id]/invites/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ emails: [] }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 201 and creates invites when emails resolve to users", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      getUserByEmailMock.mockResolvedValue({
        id: "u-1",
        name: "Bob",
        email: "bob@example.com",
      });
      userIsInGameMock.mockResolvedValue(false);
      hasPendingInviteMock.mockResolvedValue(false);
      createGameInvitesMock.mockResolvedValue({ count: 1 });
      const { POST } = await import("@/app/api/games/[id]/invites/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ emails: ["bob@example.com"] }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      expect(createGameInvitesMock).toHaveBeenCalledWith("g-1", "gm-1", [
        "u-1",
      ]);
      const data = await response.json();
      expect(data.invitedEmails).toContain("bob@example.com");
    });
  });
});
