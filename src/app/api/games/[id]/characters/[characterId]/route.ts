import { getCharacter } from "@/app/lib/prisma/character";
import { gameMasterCanViewGameCharacter } from "@/app/lib/prisma/gameCharacter";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
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

    if (!(await gameMasterCanViewGameCharacter(gameId, characterId, userId))) {
      logger.warn({
        method: "GET",
        route: "/api/games/[id]/characters/[characterId]",
        message: "Forbidden game master character view",
        gameId,
        characterId,
        userId,
      });
      return errorResponse(
        "Only the game master can view characters linked to this game",
        403
      );
    }

    const character = await getCharacter(characterId);
    if (!character) {
      return errorResponse("Character not found", 404);
    }

    const { notes: _notes, ...rest } = character;

    return NextResponse.json(
      {
        ...rest,
        notes: [],
        access: { canEdit: false, canRoll: false },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[id]/characters/[characterId]",
      message: "Error fetching character for game master view",
      error,
    });
    return errorResponse(
      "Error fetching character",
      500,
      serializeError(error)
    );
  }
});
