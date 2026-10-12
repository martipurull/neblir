import { renameNpcGroup } from "@/app/lib/prisma/npcGroup";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { npcGroupRenameSchema } from "@/app/lib/types/game";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

function renameNpcGroupErrorResponse(reason: string) {
  if (reason === "unauthorised") {
    return errorResponse(
      "Only the game master can rename NPC groups for this game",
      403
    );
  }
  if (reason === "not_found") {
    return errorResponse("Game not found", 404);
  }
  if (reason === "missing") {
    return errorResponse("NPC group not found", 404);
  }
  if (reason === "not_a_group") {
    return errorResponse("Ungrouped is not an NPC group", 400);
  }
  if (reason === "reserved") {
    return errorResponse("Archived is a reserved NPC group", 400);
  }
  return errorResponse(
    "Enter a group name. Ungrouped clears a character, it does not rename the section.",
    400
  );
}

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const requesterId = request.auth.user.id;
    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const parsed = npcGroupRenameSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const result = await renameNpcGroup(
      gameId,
      requesterId,
      parsed.data.from,
      parsed.data.npcGroup
    );
    if (!result.ok) {
      return renameNpcGroupErrorResponse(result.reason);
    }

    return NextResponse.json({ npcGroup: result.npcGroup }, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/games/[id]/npc-groups",
      message: "Error renaming NPC group",
      error,
    });
    return errorResponse(
      "Error renaming NPC group",
      500,
      serializeError(error)
    );
  }
});
