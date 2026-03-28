import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  invokeRoute,
  makeAuthedRequest,
  makeParams,
  makeUnauthedRequest,
} from "../../../../helpers";

const getGameMock = vi.fn();

vi.mock("@/app/lib/prisma/game", () => ({
  getGame: getGameMock,
}));

describe("/api/games/[id]/discord/connect", () => {
  const originalClientId = process.env.DISCORD_CLIENT_ID;
  const originalRedirect = process.env.DISCORD_REDIRECT_URI;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DISCORD_CLIENT_ID = "test-client-id";
    process.env.DISCORD_REDIRECT_URI =
      "http://localhost:3000/api/discord/callback";
  });

  afterEach(() => {
    process.env.DISCORD_CLIENT_ID = originalClientId;
    process.env.DISCORD_REDIRECT_URI = originalRedirect;
  });

  describe("GET", () => {
    it("returns 401 when unauthenticated", async () => {
      const { GET } = await import(
        "@/app/api/games/[id]/discord/connect/route"
      );
      const response = await invokeRoute(
        GET,
        makeUnauthedRequest(),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(401);
    });

    it("returns 403 when caller is not game master", async () => {
      getGameMock.mockResolvedValue({
        id: "g-1",
        gameMaster: "gm-1",
      });
      const { GET } = await import(
        "@/app/api/games/[id]/discord/connect/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "other-user"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(403);
    });

    it("returns 404 when game not found", async () => {
      getGameMock.mockResolvedValue(null);
      const { GET } = await import(
        "@/app/api/games/[id]/discord/connect/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(404);
    });

    it("returns 500 when Discord env vars missing", async () => {
      delete process.env.DISCORD_CLIENT_ID;
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      const { GET } = await import(
        "@/app/api/games/[id]/discord/connect/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(500);
    });

    it("returns 200 with oauth authorize url for GM", async () => {
      getGameMock.mockResolvedValue({ id: "g-1", gameMaster: "gm-1" });
      const { GET } = await import(
        "@/app/api/games/[id]/discord/connect/route"
      );
      const response = await invokeRoute(
        GET,
        makeAuthedRequest(undefined, "gm-1"),
        makeParams({ id: "g-1" })
      );
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.url).toMatch(/^https:\/\/discord\.com\/oauth2\/authorize\?/);
      expect(json.url).toContain("client_id=test-client-id");
      expect(json.url).toContain("response_type=code");
      expect(json.url).toContain("state=");
    });
  });
});
