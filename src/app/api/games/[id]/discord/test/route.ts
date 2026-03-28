import { errorResponse } from "@/app/api/shared/responses";
import { serializeError } from "@/app/api/shared/errors";
import { prisma } from "@/app/lib/prisma/client";
import { getGame } from "@/app/lib/prisma/game";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import logger from "@/logger";
import { NextResponse } from "next/server";

function integrationAllowsDelivery(status: string): boolean {
  return status === "ACTIVE" || status === "DEGRADED";
}

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }
    const userId = request.auth.user.id;
    const { id: gameId } = (await params) as { id: string };
    if (!gameId) return errorResponse("Invalid game ID", 400);

    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== userId) {
      return errorResponse("Only the game master can configure Discord", 403);
    }

    const integration = await prisma.discordIntegration.findUnique({
      where: { gameId },
    });
    if (!integration) {
      return errorResponse(
        "Discord is not configured for this game",
        400,
        "Save a channel in the Discord section first."
      );
    }
    if (!integrationAllowsDelivery(integration.status)) {
      return errorResponse(
        "Discord integration is disabled for this game",
        400,
        `Current status: ${integration.status}. Reconnect or save the channel again.`
      );
    }

    const rollEvent = await prisma.rollEvent.create({
      data: {
        gameId,
        rollerUserId: userId,
        rollType: "GENERAL_ROLL",
        diceExpression: "test",
        results: [1],
        total: 1,
        metadata: { system: true, message: "Discord connection test" },
      },
    });

    await prisma.discordOutbox.create({
      data: {
        rollEventId: rollEvent.id,
        integrationId: integration.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({ queued: true }, { status: 200 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games/[id]/discord/test",
      message: "Error queueing Discord test",
      error,
    });
    return errorResponse(
      "Error queueing Discord test",
      500,
      serializeError(error)
    );
  }
});
