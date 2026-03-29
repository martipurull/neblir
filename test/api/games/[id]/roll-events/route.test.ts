import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const userIsInGameMock = vi.fn();
const getGameMock = vi.fn();
const characterIsInGameMock = vi.fn();
const userOwnsCharacterMock = vi.fn();

const prismaMocks = vi.hoisted(() => ({
  discordIntegration: { findUnique: vi.fn() },
  rollEvent: { create: vi.fn() },
  discordOutbox: { create: vi.fn() },
}));

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
  userIsInGame: userIsInGameMock,
}));

vi.mock("@/app/lib/prisma/gameCharacter", () => ({
  characterIsInGame: characterIsInGameMock,
  userOwnsCharacter: userOwnsCharacterMock,
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: prismaMocks,
}));

const validBody = {
  rollType: "GENERAL_ROLL" as const,
  results: [7, 3],
  total: 10,
};

describe("/api/games/[id]/roll-events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMocks.discordIntegration.findUnique.mockResolvedValue(null);
    prismaMocks.rollEvent.create.mockResolvedValue({ id: "re-1" });
    prismaMocks.discordOutbox.create.mockResolvedValue({});
  });

  describe("POST", () => {
    it("returns 401 when unauthenticated", async () => {
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeUnauthedRequest({}),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when user is not in game", async () => {
      userIsInGameMock.mockResolvedValue(false);
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(validBody, "user-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
    });

    it("returns 404 when game not found", async () => {
      userIsInGameMock.mockResolvedValue(true);
      getGameMock.mockResolvedValue(null);
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(validBody, "user-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 400 for invalid body", async () => {
      userIsInGameMock.mockResolvedValue(true);
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ rollType: "GENERAL_ROLL", results: [] }, "user-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 201 without outbox when no Discord integration", async () => {
      userIsInGameMock.mockResolvedValue(true);
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      prismaMocks.discordIntegration.findUnique.mockResolvedValue(null);
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(validBody, "user-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.queued).toBe(false);
      expect(prismaMocks.rollEvent.create).toHaveBeenCalled();
      expect(prismaMocks.discordOutbox.create).not.toHaveBeenCalled();
    });

    it("returns 201 and enqueues outbox when integration is ACTIVE", async () => {
      userIsInGameMock.mockResolvedValue(true);
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      prismaMocks.discordIntegration.findUnique.mockResolvedValue({
        id: "di-1",
        gameId: "g-1",
        status: "ACTIVE",
      });
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(validBody, "user-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.queued).toBe(true);
      expect(prismaMocks.discordOutbox.create).toHaveBeenCalledWith({
        data: {
          rollEventId: "re-1",
          integrationId: "di-1",
          status: "PENDING",
        },
      });
    });

    it("returns 201 and enqueues outbox when integration is DEGRADED", async () => {
      userIsInGameMock.mockResolvedValue(true);
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      prismaMocks.discordIntegration.findUnique.mockResolvedValue({
        id: "di-1",
        gameId: "g-1",
        status: "DEGRADED",
      });
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(validBody, "user-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.queued).toBe(true);
      expect(prismaMocks.discordOutbox.create).toHaveBeenCalled();
    });

    it("returns 403 when character not in game", async () => {
      userIsInGameMock.mockResolvedValue(true);
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      characterIsInGameMock.mockResolvedValue(false);
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ ...validBody, characterId: "c-1" }, "user-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
    });

    it("returns 403 when non-GM submits for character they do not own", async () => {
      userIsInGameMock.mockResolvedValue(true);
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      characterIsInGameMock.mockResolvedValue(true);
      userOwnsCharacterMock.mockResolvedValue(false);
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ ...validBody, characterId: "c-1" }, "player-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
    });

    it("allows GM to submit roll for any in-game character", async () => {
      userIsInGameMock.mockResolvedValue(true);
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      characterIsInGameMock.mockResolvedValue(true);
      userOwnsCharacterMock.mockResolvedValue(false);
      const { POST } = await import("@/app/api/games/[id]/roll-events/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest({ ...validBody, characterId: "c-1" }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(201);
    });
  });
});
