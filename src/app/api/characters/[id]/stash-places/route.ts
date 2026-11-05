import { prisma } from "@/app/lib/prisma/client";
import {
  characterIsInGame,
  userHasPlayControl,
} from "@/app/lib/prisma/gameCharacter";
import { stashPlaceNames, type StashPlaceHolding } from "@/app/lib/stashPlace";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

const route = "/api/characters/[id]/stash-places";

async function loadStashPlaceHoldings(
  characterId: string,
  gameId: string | null
): Promise<StashPlaceHolding[]> {
  const rows = await prisma.itemCharacter.findMany({
    where:
      gameId == null
        ? { characterId, stashGameId: null }
        : {
            OR: [{ stashGameId: gameId }, { characterId, stashGameId: null }],
          },
    select: {
      characterId: true,
      itemLocation: true,
      stashGameId: true,
    },
  });
  return rows.map((row) => ({
    characterId: row.characterId,
    itemLocation: row.itemLocation,
    stashGameId: row.stashGameId,
  }));
}

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route,
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      return errorResponse("Invalid character ID", 400);
    }
    if (!(await userHasPlayControl(id, request.auth.user.id))) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const gameIdParam =
      new URL(request.url).searchParams.get("gameId")?.trim() ?? "";
    const gameId = gameIdParam === "" ? null : gameIdParam;
    if (gameId != null && !(await characterIsInGame(gameId, id))) {
      return errorResponse(
        "Character is not linked to the supplied game.",
        400
      );
    }

    const holdings = await loadStashPlaceHoldings(id, gameId);
    return NextResponse.json(stashPlaceNames(holdings, id, gameId));
  } catch (error) {
    logger.error({
      method: "GET",
      route,
      message: "Error retrieving stash place names",
      error,
    });
    return errorResponse(
      "Error retrieving stash place names",
      500,
      serializeError(error)
    );
  }
});
