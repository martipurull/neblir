import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../helpers";

const getGameMock = vi.fn();

const prismaMocks = vi.hoisted(() => ({
  discordIntegration: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
}));

vi.mock("@/app/lib/prisma/client", () => ({
  prisma: prismaMocks,
}));

describe("/api/games/[id]/discord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH", () => {
    it("returns 401 when unauthenticated", async () => {
      const { PATCH } = await import("@/app/api/games/[id]/discord/route");
      const response = await invokeRoute(
        PATCH,
        makeUnauthedRequest({ guildId: "guild-1", channelId: "ch-1" }),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when caller is not game master", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      const { PATCH } = await import("@/app/api/games/[id]/discord/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest(
          { guildId: "guild-1", channelId: "ch-1" },
          "other-user"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
    });

    it("returns 400 for invalid body", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      const { PATCH } = await import("@/app/api/games/[id]/discord/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ guildId: "guild-1" }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 200 and upserts integration", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      prismaMocks.discordIntegration.upsert.mockResolvedValue({
        id: "di-1",
        gameId: "g-1",
        guildId: "guild-1",
        channelId: "ch-1",
        status: "ACTIVE",
      });
      const { PATCH } = await import("@/app/api/games/[id]/discord/route");
      const response = await invokeRoute(
        PATCH,
        makeAuthedRequest({ guildId: "guild-1", channelId: "ch-1" }, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.integration.guildId).toBe("guild-1");
      expect(json.integration.channelId).toBe("ch-1");
      expect(prismaMocks.discordIntegration.upsert).toHaveBeenCalled();
    });
  });

  describe("DELETE", () => {
    it("returns 401 when unauthenticated", async () => {
      const { DELETE } = await import("@/app/api/games/[id]/discord/route");
      const response = await invokeRoute(
        DELETE,
        makeUnauthedRequest(),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 200 and deletes integration", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      prismaMocks.discordIntegration.deleteMany.mockResolvedValue({ count: 1 });
      const { DELETE } = await import("@/app/api/games/[id]/discord/route");
      const response = await invokeRoute(
        DELETE,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.ok).toBe(true);
      expect(prismaMocks.discordIntegration.deleteMany).toHaveBeenCalledWith({
        where: { gameId: "g-1" },
      });
    });
  });
});
