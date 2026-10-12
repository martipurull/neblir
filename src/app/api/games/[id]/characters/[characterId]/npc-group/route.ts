import { setNpcGroup } from "@/app/lib/prisma/npcGroup";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { npcGroupUpdateSchema } from "@/app/lib/types/game";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../../../shared/errors";
import { errorResponse } from "../../../../../shared/responses";

function npcGroupErrorResponse(reason: string) {
  if (reason === "unauthorised") {
    return errorResponse(
      "Only the game master can assign NPC groups for this game",
      403
    );
  }
  if (reason === "not_found") {
    return errorResponse("Game not found", 404);
  }
  if (reason === "not_linked") {
    return errorResponse("Character is not linked to this game", 404);
  }
  return errorResponse(
    "NPC groups can only be set on a GM-controlled character",
    400
  );
}

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
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

    const parsed = npcGroupUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const result = await setNpcGroup(
      gameId,
      characterId,
      requesterId,
      parsed.data.npcGroup
    );
    if (!result.ok) {
      return npcGroupErrorResponse(result.reason);
    }

    return NextResponse.json({ npcGroup: result.npcGroup }, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/games/[id]/characters/[characterId]/npc-group",
      message: "Error assigning NPC group",
      error,
    });
    return errorResponse(
      "Error assigning NPC group",
      500,
      serializeError(error)
    );
  }
});
