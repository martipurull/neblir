import { issuePlayGrant, revokePlayGrant } from "@/app/lib/prisma/playGrant";
import { playGrantUpsertSchema } from "@/app/lib/types/game";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../../../shared/errors";
import { errorResponse } from "../../../../../shared/responses";

function playGrantErrorResponse(reason: string) {
  if (reason === "unauthorised") {
    return errorResponse(
      "Only the game master can manage play grants for this game",
      403
    );
  }
  if (reason === "not_found") {
    return errorResponse("Game not found", 404);
  }
  if (reason === "not_linked") {
    return errorResponse("Character is not linked to this game", 404);
  }
  if (reason === "not_gm_controlled") {
    return errorResponse(
      "Play grants can only be issued for GM-controlled characters",
      403
    );
  }
  return errorResponse(
    "Play grant grantee must be a game member who is not the game master",
    403
  );
}

export const PUT = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const requesterId = request.auth.user.id;
    const { id: gameId, characterId } = (await params) as {
      id: string;
      characterId: string;
    };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }
    if (!characterId || typeof characterId !== "string") {
      return errorResponse("Invalid character ID", 400);
    }

    const parsed = playGrantUpsertSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const result = await issuePlayGrant(
      gameId,
      characterId,
      requesterId,
      parsed.data.userId
    );
    if (!result.ok) {
      return playGrantErrorResponse(result.reason);
    }

    return NextResponse.json(
      { playGrantUserId: result.playGrantUserId },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      method: "PUT",
      route: "/api/games/[id]/characters/[characterId]/play-grant",
      message: "Error issuing play grant",
      error,
    });
    return errorResponse(
      "Error issuing play grant",
      500,
      serializeError(error)
    );
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const requesterId = request.auth.user.id;
    const { id: gameId, characterId } = (await params) as {
      id: string;
      characterId: string;
    };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }
    if (!characterId || typeof characterId !== "string") {
      return errorResponse("Invalid character ID", 400);
    }

    const result = await revokePlayGrant(gameId, characterId, requesterId);
    if (!result.ok) {
      return playGrantErrorResponse(result.reason);
    }

    return NextResponse.json(
      { playGrantUserId: result.playGrantUserId },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/games/[id]/characters/[characterId]/play-grant",
      message: "Error revoking play grant",
      error,
    });
    return errorResponse(
      "Error revoking play grant",
      500,
      serializeError(error)
    );
  }
});
