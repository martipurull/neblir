import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequestWithUrl,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameMock = vi.fn();
const fetchChannelsMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
}));

vi.mock("@/app/lib/discord-api", () => ({
  fetchDiscordGuildChannelsWithMeta: fetchChannelsMock,
}));

describe("/api/games/[id]/discord/channels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } = await import(
        "@/app/api/games/[id]/discord/channels/route"
      );
      const response = await invokeRoute(
        GET,
        {
          ...makeUnauthedRequest(),
          url: "http://test/api/games/g-1/discord/channels?guildId=discord-g-1",
        },
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 when guildId query missing", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      const { GET } = await import(
        "@/app/api/games/[id]/discord/channels/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequestWithUrl(
          "http://test/api/games/g-1/discord/channels",
          "gm-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(400);
    });

    it("returns 502 when Discord API throws", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      fetchChannelsMock.mockRejectedValue(new Error("Discord token invalid"));
      const { GET } = await import(
        "@/app/api/games/[id]/discord/channels/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequestWithUrl(
          "http://test/api/games/g-1/discord/channels?guildId=discord-g-1",
          "gm-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(502);
    });

    it("returns 200 with guildName and channels", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      fetchChannelsMock.mockResolvedValue({
        guildName: "Test Guild",
        channels: [
          { id: "c1", name: "general", channelType: 0 },
          { id: "c2", name: "Lobby", channelType: 2 },
        ],
      });
      const { GET } = await import(
        "@/app/api/games/[id]/discord/channels/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequestWithUrl(
          "http://test/api/games/g-1/discord/channels?guildId=discord-g-1",
          "gm-1"
        ),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.guildId).toBe("discord-g-1");
      expect(json.guildName).toBe("Test Guild");
      expect(json.channels).toHaveLength(2);
      expect(json.channels[0].channelType).toBe(0);
    });
  });
});
