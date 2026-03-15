import { declineGameInvite } from "@/app/lib/prisma/game";
import { auth } from "@/auth";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/games/[id]/invites/decline",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) {
      return errorResponse("User ID not found", 400);
    }

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const declined = await declineGameInvite(gameId, userId);
    if (!declined) {
      return errorResponse("Invite not found or already used", 404);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games/[id]/invites/decline",
      message: "Error declining invite",
      error,
    });
    return errorResponse("Error declining invite", 500, serializeError(error));
  }
});
