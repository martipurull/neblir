import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const guildId = url.searchParams.get("guild_id");

  if (!state) {
    return NextResponse.redirect(new URL("/home/games", url.origin));
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8")
    ) as {
      gameId?: string;
    };
    if (!parsed.gameId) {
      return NextResponse.redirect(new URL("/home/games", url.origin));
    }
    const redirectUrl = new URL(`/home/games/${parsed.gameId}/gm`, url.origin);
    if (guildId) {
      redirectUrl.searchParams.set("discordGuildId", guildId);
    }
    redirectUrl.searchParams.set("discordConnected", "1");
    return NextResponse.redirect(redirectUrl);
  } catch {
    return NextResponse.redirect(new URL("/home/games", url.origin));
  }
}
