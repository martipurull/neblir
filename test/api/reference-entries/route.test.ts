import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeUnauthedRequest,
} from "../helpers";

const getReferenceEntriesMock = vi.fn();
const createReferenceEntryMock = vi.fn();
const getGameMock = vi.fn();
const userIsInGameMock = vi.fn();

vi.mock("@/app/lib/prisma/referenceEntry", () => ({
  getReferenceEntries: getReferenceEntriesMock,
  createReferenceEntry: createReferenceEntryMock,
}));

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

function requestWithSearch(search: string, userId = "user-1") {
  return {
    ...makeAuthedRequest(undefined, userId),
    nextUrl: { searchParams: new URLSearchParams(search) },
  } as any;
}

describe("/api/reference-entries route handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } = await import("@/app/api/reference-entries/route");
      const request = {
        ...makeUnauthedRequest(),
        nextUrl: { searchParams: new URLSearchParams("category=WORLD") },
      } as any;

      const response = await invokeRoute(GET, request);
      expect(response.status).toBe(401);
    });

    it("returns 400 for invalid category", async () => {
      const { GET } = await import("@/app/api/reference-entries/route");
      const response = await invokeRoute(
        GET,
        requestWithSearch("category=BAD")
      );

      expect(response.status).toBe(400);
      expect(getReferenceEntriesMock).not.toHaveBeenCalled();
    });

    it("returns 400 when campaign lore is requested without a gameId", async () => {
      const { GET } = await import("@/app/api/reference-entries/route");
      const response = await invokeRoute(
        GET,
        requestWithSearch("category=CAMPAIGN_LORE")
      );

      expect(response.status).toBe(400);
    });

    it("returns 403 when game-scoped entries are requested by a non-member", async () => {
      userIsInGameMock.mockResolvedValue(false);
      const { GET } = await import("@/app/api/reference-entries/route");

      const response = await invokeRoute(
        GET,
        requestWithSearch("category=CAMPAIGN_LORE&gameId=game-1")
      );

      expect(response.status).toBe(403);
      expect(getReferenceEntriesMock).not.toHaveBeenCalled();
    });

    it("returns only player-visible entries for non-GMs", async () => {
      userIsInGameMock.mockResolvedValue(true);
      getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "gm-1" });
      getReferenceEntriesMock.mockResolvedValue([
        { id: "r-1", access: "PLAYER" },
        { id: "r-2", access: "GAME_MASTER" },
      ]);
      const { GET } = await import("@/app/api/reference-entries/route");

      const response = await invokeRoute(
        GET,
        requestWithSearch("category=CAMPAIGN_LORE&gameId=game-1", "player-1")
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([
        { id: "r-1", access: "PLAYER" },
      ]);
      expect(getReferenceEntriesMock).toHaveBeenCalledWith({
        category: "CAMPAIGN_LORE",
        gameId: "game-1",
      });
    });

    it("returns GM-only entries for the game master", async () => {
      userIsInGameMock.mockResolvedValue(true);
      getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "gm-1" });
      getReferenceEntriesMock.mockResolvedValue([
        { id: "r-1", access: "PLAYER" },
        { id: "r-2", access: "GAME_MASTER" },
      ]);
      const { GET } = await import("@/app/api/reference-entries/route");

      const response = await invokeRoute(
        GET,
        requestWithSearch("category=CAMPAIGN_LORE&gameId=game-1", "gm-1")
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([
        { id: "r-1", access: "PLAYER" },
        { id: "r-2", access: "GAME_MASTER" },
      ]);
    });

    it("returns global player-visible entries", async () => {
      getReferenceEntriesMock.mockResolvedValue([
        { id: "r-1", access: "PLAYER" },
        { id: "r-2", access: "GAME_MASTER" },
      ]);
      const { GET } = await import("@/app/api/reference-entries/route");

      const response = await invokeRoute(
        GET,
        requestWithSearch("category=WORLD")
      );

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([
        { id: "r-1", access: "PLAYER" },
      ]);
      expect(getReferenceEntriesMock).toHaveBeenCalledWith({
        category: "WORLD",
        gameId: null,
      });
    });

    it("returns 500 when fetching throws", async () => {
      getReferenceEntriesMock.mockRejectedValue(new Error("db down"));
      const { GET } = await import("@/app/api/reference-entries/route");

      const response = await invokeRoute(
        GET,
        requestWithSearch("category=WORLD")
      );

      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toMatchObject({
        message: "Error fetching reference entries",
      });
    });
  });

  describe("POST", () => {
    it("returns 401 when unauthenticated", async () => {
      const { POST } = await import("@/app/api/reference-entries/route");
      const response = await invokeRoute(POST, makeUnauthedRequest());

      expect(response.status).toBe(401);
    });

    it("returns 400 for invalid body", async () => {
      const { POST } = await import("@/app/api/reference-entries/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ category: "WORLD" })
      );

      expect(response.status).toBe(400);
      expect(createReferenceEntryMock).not.toHaveBeenCalled();
    });

    it("returns 404 when a scoped game does not exist", async () => {
      getGameMock.mockResolvedValue(null);
      const { POST } = await import("@/app/api/reference-entries/route");

      const response = await invokeRoute(
        POST,
        makeAuthedRequest({
          category: "CAMPAIGN_LORE",
          slug: "intro",
          title: "Intro",
          gameId: "game-1",
        })
      );

      expect(response.status).toBe(404);
    });

    it("returns 403 when creating scoped entries as a non-GM", async () => {
      getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "gm-1" });
      const { POST } = await import("@/app/api/reference-entries/route");

      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            category: "CAMPAIGN_LORE",
            slug: "intro",
            title: "Intro",
            gameId: "game-1",
          },
          "player-1"
        )
      );

      expect(response.status).toBe(403);
      expect(createReferenceEntryMock).not.toHaveBeenCalled();
    });

    it("returns 201 for global entries", async () => {
      createReferenceEntryMock.mockResolvedValue({ id: "r-1", title: "World" });
      const { POST } = await import("@/app/api/reference-entries/route");

      const response = await invokeRoute(
        POST,
        makeAuthedRequest({
          category: "WORLD",
          slug: "world",
          title: "World",
        })
      );

      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual({
        id: "r-1",
        title: "World",
      });
    });

    it("returns 201 for scoped entries created by the GM", async () => {
      getGameMock.mockResolvedValue({ id: "game-1", gameMaster: "gm-1" });
      createReferenceEntryMock.mockResolvedValue({ id: "r-1" });
      const { POST } = await import("@/app/api/reference-entries/route");

      const response = await invokeRoute(
        POST,
        makeAuthedRequest(
          {
            category: "CAMPAIGN_LORE",
            slug: "intro",
            title: "Intro",
            gameId: "game-1",
          },
          "gm-1"
        )
      );

      expect(response.status).toBe(201);
      expect(createReferenceEntryMock).toHaveBeenCalled();
    });

    it("returns 500 when creation throws", async () => {
      createReferenceEntryMock.mockRejectedValue(new Error("db down"));
      const { POST } = await import("@/app/api/reference-entries/route");

      const response = await invokeRoute(
        POST,
        makeAuthedRequest({
          category: "WORLD",
          slug: "world",
          title: "World",
        })
      );

      expect(response.status).toBe(500);
    });
  });
});
