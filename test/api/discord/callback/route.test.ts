import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

describe("/api/discord/callback", () => {
  it("redirects to /home/games when state is missing", async () => {
    const { GET } = await import("@/app/api/discord/callback/route");
    const request = new NextRequest(
      "http://localhost:3000/api/discord/callback?guild_id=123"
    );
    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toMatch(/\/home\/games$/);
  });

  it("redirects to game GM with discordGuildId when state decodes", async () => {
    const state = Buffer.from(JSON.stringify({ gameId: "game-abc" })).toString(
      "base64url"
    );
    const { GET } = await import("@/app/api/discord/callback/route");
    const request = new NextRequest(
      `http://localhost:3000/api/discord/callback?state=${encodeURIComponent(state)}&guild_id=discord-guild-99`
    );
    const response = await GET(request);
    expect(response.status).toBe(307);
    const loc = response.headers.get("location");
    expect(loc).toContain("/home/games/game-abc/gm");
    expect(loc).toContain("discordGuildId=discord-guild-99");
    expect(loc).toContain("discordConnected=1");
  });

  it("redirects to /home/games when state JSON is invalid", async () => {
    const { GET } = await import("@/app/api/discord/callback/route");
    const request = new NextRequest(
      "http://localhost:3000/api/discord/callback?state=not-valid-base64!!!"
    );
    const response = await GET(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toMatch(/\/home\/games$/);
  });
});
