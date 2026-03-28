import { errorResponse } from "@/app/api/shared/responses";
import { prisma } from "@/app/lib/prisma/client";
import { getGame } from "@/app/lib/prisma/game";
import { saveDiscordIntegrationBodySchema } from "@/app/lib/types/discord";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
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

  const parsed = saveDiscordIntegrationBodySchema.safeParse(
    await request.json()
  );
  if (!parsed.success) {
    return errorResponse(
      "Invalid request body",
      400,
      parsed.error.issues.map((issue) => issue.message).join(". ")
    );
  }

  const integration = await prisma.discordIntegration.upsert({
    where: { gameId },
    create: {
      gameId,
      guildId: parsed.data.guildId,
      channelId: parsed.data.channelId,
      installedByUserId: request.auth.user.id,
      status: "ACTIVE",
    },
    update: {
      guildId: parsed.data.guildId,
      channelId: parsed.data.channelId,
      installedByUserId: request.auth.user.id,
      status: "ACTIVE",
      lastError: null,
    },
  });

  return NextResponse.json({ integration }, { status: 200 });
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
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

  await prisma.discordIntegration.deleteMany({ where: { gameId } });
  return NextResponse.json({ ok: true }, { status: 200 });
});
