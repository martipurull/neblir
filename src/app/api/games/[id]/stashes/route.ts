import { renameStash } from "@/app/lib/prisma/stash";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { stashRenameSchema } from "@/app/lib/types/game";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

function renameStashErrorResponse(
  result:
    | { reason: "unauthorised" }
    | { reason: "not_found" }
    | { reason: "missing" }
    | { reason: "invalid"; message: string }
) {
  switch (result.reason) {
    case "unauthorised":
      return errorResponse(
        "You do not have play control of a character in this game.",
        403
      );
    case "not_found":
      return errorResponse("Game not found", 404);
    case "missing":
      return errorResponse("Stash not found", 404);
    case "invalid":
      return errorResponse(result.message, 400);
  }
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

    const parsed = stashRenameSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const result = await renameStash(
      gameId,
      requesterId,
      parsed.data.from,
      parsed.data.placeName
    );
    if (!result.ok) {
      return renameStashErrorResponse(result);
    }

    return NextResponse.json({ placeName: result.placeName }, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/games/[id]/stashes",
      message: "Error renaming stash",
      error,
    });
    return errorResponse("Error renaming stash", 500, serializeError(error));
  }
});
