import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../helpers";

const getReferenceEntryMock = vi.fn();
const updateReferenceEntryMock = vi.fn();
const deleteReferenceEntryMock = vi.fn();
const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();

vi.mock("@/app/lib/prisma/referenceEntry", () => ({
  getReferenceEntry: getReferenceEntryMock,
  updateReferenceEntry: updateReferenceEntryMock,
  deleteReferenceEntry: deleteReferenceEntryMock,
}));

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

const playerEntry = { id: "r-1", gameId: null, access: "PLAYER" };
const gmEntry = { id: "r-1", gameId: "game-1", access: "GAME_MASTER" };

describe("/api/reference-entries/[id] route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } = await import("@/app/api/reference-entries/[id]/route");
      const response = await invokeRoute(
        GET,
        makeUnauthedRequest(),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(401);
    });

    it("returns 404 when entry is missing", async () => {
      getReferenceEntryMock.mockResolvedValue(null);
      const { GET } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(404);
    });

    it("returns 403 for global GM-only entries", async () => {
      getReferenceEntryMock.mockResolvedValue({
        id: "r-1",
        gameId: null,
        access: "GAME_MASTER",
      });
      const { GET } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(403);
    });

    it("returns 403 for game entries when the user is not in the game", async () => {
      getReferenceEntryMock.mockResolvedValue(playerEntry);
      getReferenceEntryMock.mockResolvedValue({
        ...playerEntry,
        gameId: "game-1",
      });
      userIsInGameMock.mockResolvedValue(false);
      const { GET } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(403);
    });

    it("returns 200 for global player entries", async () => {
      getReferenceEntryMock.mockResolvedValue(playerEntry);
      const { GET } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(playerEntry);
    });

    it("returns 200 for game player entries when the user is in the game", async () => {
      const entry = { ...playerEntry, gameId: "game-1" };
      getReferenceEntryMock.mockResolvedValue(entry);
      userIsInGameMock.mockResolvedValue(true);
      const { GET } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(200);
    });

    it("returns 200 for game GM-only entries when the user is the GM", async () => {
      getReferenceEntryMock.mockResolvedValue(gmEntry);
      userIsInGameMock.mockResolvedValue(true);
      getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "gm-1" });
      const { GET } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(200);
    });

    it("returns 500 when fetching throws", async () => {
      getReferenceEntryMock.mockRejectedValue(new Error("db down"));
      const { GET } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        GET,
        makeAuthedRequest(),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(500);
    });
  });

  describe("PATCH", () => {
    it("returns 401 when unauthenticated", async () => {
      const { PATCH } = await import("@/app/api/reference-entries/[id]/route");
      const response = await invokeRoute(
        PATCH,
        makeUnauthedRequest(),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(401);
    });

    it("returns 404 when entry is missing", async () => {
      getReferenceEntryMock.mockResolvedValue(null);
      const { PATCH } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ title: "Updated" }),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(404);
    });

    it("returns 403 when a non-GM updates a game entry", async () => {
      getReferenceEntryMock.mockResolvedValue({
        ...playerEntry,
        gameId: "game-1",
      });
      getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "gm-1" });
      const { PATCH } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ title: "Updated" }, "player-1"),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(403);
    });

    it("returns 400 for invalid body", async () => {
      getReferenceEntryMock.mockResolvedValue(playerEntry);
      const { PATCH } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ access: "BAD" }),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(400);
    });

    it("returns 400 when changing to campaign lore without a gameId", async () => {
      getReferenceEntryMock.mockResolvedValue(playerEntry);
      const { PATCH } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ category: "CAMPAIGN_LORE" }),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(400);
    });

    it("returns 404 when moving to a missing game", async () => {
      getReferenceEntryMock.mockResolvedValue(playerEntry);
      getGameMock.mockResolvedValue(null);
      const { PATCH } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ gameId: "game-2" }),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(404);
    });

    it("returns 403 when moving to a game the user does not GM", async () => {
      getReferenceEntryMock.mockResolvedValue(playerEntry);
      getGameMock.mockResolvedValue({ id: "game-2", gameMaster: "gm-2" });
      const { PATCH } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ gameId: "game-2" }, "gm-1"),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(403);
    });

    it("returns 200 on success", async () => {
      getReferenceEntryMock.mockResolvedValue(playerEntry);
      updateReferenceEntryMock.mockResolvedValue({
        ...playerEntry,
        title: "Updated",
      });
      const { PATCH } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ title: "Updated" }),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(200);
      expect(updateReferenceEntryMock).toHaveBeenCalledWith("r-1", {
        title: "Updated",
      });
    });

    it("returns 500 when update throws", async () => {
      getReferenceEntryMock.mockResolvedValue(playerEntry);
      updateReferenceEntryMock.mockRejectedValue(new Error("db down"));
      const { PATCH } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ title: "Updated" }),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(500);
    });
  });

  describe("DELETE", () => {
    it("returns 401 when unauthenticated", async () => {
      const { DELETE } = await import("@/app/api/reference-entries/[id]/route");
      const response = await invokeRoute(
        DELETE,
        makeUnauthedRequest(),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(401);
    });

    it("returns 404 when entry is missing", async () => {
      getReferenceEntryMock.mockResolvedValue(null);
      const { DELETE } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(404);
    });

    it("returns 403 when a non-GM deletes a game entry", async () => {
      getReferenceEntryMock.mockResolvedValue({
        ...playerEntry,
        gameId: "game-1",
      });
      getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "gm-1" });
      const { DELETE } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "player-1"),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(403);
    });

    it("returns 204 on success", async () => {
      getReferenceEntryMock.mockResolvedValue(playerEntry);
      deleteReferenceEntryMock.mockResolvedValue(playerEntry);
      const { DELETE } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(204);
      expect(deleteReferenceEntryMock).toHaveBeenCalledWith("r-1");
    });

    it("returns 500 when delete throws", async () => {
      getReferenceEntryMock.mockResolvedValue(playerEntry);
      deleteReferenceEntryMock.mockRejectedValue(new Error("db down"));
      const { DELETE } = await import("@/app/api/reference-entries/[id]/route");

      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(),
        makeParams({ id: "r-1" })
      );

      expect(response.status).toBe(500);
    });
  });
});
