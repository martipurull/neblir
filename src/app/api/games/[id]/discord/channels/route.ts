import { errorResponse } from "@/app/api/shared/responses";
import { fetchDiscordGuildChannelsWithMeta } from "@/app/lib/discord-api";
import { getGame } from "@/app/lib/prisma/game";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  if (!request.auth?.user?.id) {
    return errorResponse("Unauthorised", 401);
  }
  const { id: gameId } = (await params) as { id: string };
  if (!gameId) return errorResponse("Invalid game ID", 400);

  const game = await getGame(gameId);
  if (!game) return errorResponse("Game not found", 404);
  if (game.gameMaster !== request.auth.user.id) {
    return errorResponse("Only the game master can configure Discord", 403);
  }

  const url = new URL(request.url);
  const guildId = url.searchParams.get("guildId");
  if (!guildId) return errorResponse("guildId is required", 400);

  try {
    const { guildName, channels } =
      await fetchDiscordGuildChannelsWithMeta(guildId);
    return NextResponse.json({ guildId, guildName, channels }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Discord API error";
    return errorResponse("Failed to load Discord channels", 502, message);
  }
});
