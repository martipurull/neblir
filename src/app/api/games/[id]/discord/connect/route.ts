import { errorResponse } from "@/app/api/shared/responses";
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
    return errorResponse("Only the game master can connect Discord", 403);
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return errorResponse("Discord OAuth env vars are missing", 500);
  }

  const state = Buffer.from(
    JSON.stringify({ gameId, userId: request.auth.user.id })
  ).toString("base64url");

  const query = new URLSearchParams({
    client_id: clientId,
    permissions: "3072",
    scope: "bot applications.commands",
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    disable_guild_select: "false",
  });

  return NextResponse.json({
    url: `https://discord.com/oauth2/authorize?${query.toString()}`,
  });
});
