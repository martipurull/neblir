import { getGameInvitesForUser } from "@/app/lib/prisma/game";
import { auth } from "@/auth";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/games/invites",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) {
      return errorResponse("User ID not found", 400);
    }

    const invites = await getGameInvitesForUser(userId);
    const payload = invites.map((inv) => ({
      gameId: inv.game.id,
      gameName: inv.game.name,
      invitedByName: inv.invitedBy.name,
      createdAt: inv.createdAt,
    }));

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/invites",
      message: "Error fetching game invites",
      error,
    });
    return errorResponse(
      "Error fetching game invites",
      500,
      serializeError(error)
    );
  }
});
