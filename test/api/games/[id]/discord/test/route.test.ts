import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameMock = vi.fn();

const prismaMocks = vi.hoisted(() => ({
  discordIntegration: { findUnique: vi.fn() },
  rollEvent: { create: vi.fn() },
  discordOutbox: { create: vi.fn() },
}));

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: prismaMocks,
}));

describe("/api/games/[id]/discord/test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMocks.rollEvent.create.mockResolvedValue({ id: "re-test-1" });
    prismaMocks.discordOutbox.create.mockResolvedValue({});
  });

  describe("POST", () => {
    it("returns 401 when unauthenticated", async () => {
      const { POST } = await import("@/app/api/games/[id]/discord/test/route");
      const response = await invokeRoute(
        POST,
        makeUnauthedRequest(),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when caller is not game master", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      const { POST } = await import("@/app/api/games/[id]/discord/test/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(undefined, "other-user"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
    });

    it("returns 400 when Discord integration row missing", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      prismaMocks.discordIntegration.findUnique.mockResolvedValue(null);
      const { POST } = await import("@/app/api/games/[id]/discord/test/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.message).toMatch(/not configured/i);
    });

    it("returns 400 when integration is DISABLED", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      prismaMocks.discordIntegration.findUnique.mockResolvedValue({
        id: "di-1",
        gameId: "g-1",
        status: "DISABLED",
      });
      const { POST } = await import("@/app/api/games/[id]/discord/test/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 200 and creates roll + outbox when ACTIVE", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      prismaMocks.discordIntegration.findUnique.mockResolvedValue({
        id: "di-1",
        gameId: "g-1",
        status: "ACTIVE",
      });
      const { POST } = await import("@/app/api/games/[id]/discord/test/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.queued).toBe(true);
      expect(prismaMocks.rollEvent.create).toHaveBeenCalled();
      expect(prismaMocks.discordOutbox.create).toHaveBeenCalledWith({
        data: {
          rollEventId: "re-test-1",
          integrationId: "di-1",
          status: "PENDING",
        },
      });
    });

    it("returns 200 when integration is DEGRADED", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      prismaMocks.discordIntegration.findUnique.mockResolvedValue({
        id: "di-1",
        gameId: "g-1",
        status: "DEGRADED",
      });
      const { POST } = await import("@/app/api/games/[id]/discord/test/route");
      const response = await invokeRoute(
        POST,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(200);
    });
  });
});
