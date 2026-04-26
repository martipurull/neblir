import {
  createReferenceEntry,
  getReferenceEntries,
} from "@/app/lib/prisma/referenceEntry";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import type { AuthNextRequest } from "@/app/lib/types/api";
import {
  referenceCategorySchema,
  referenceEntryCreateSchema,
} from "@/app/lib/types/reference";
import { auth } from "@/auth";
import logger from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../shared/errors";
import { errorResponse } from "../shared/responses";

const route = "/api/reference-entries";

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    const { searchParams } = request.nextUrl;
    const categoryParam = searchParams.get("category") ?? undefined;
    const gameId = searchParams.get("gameId");

    const parsedCategory = categoryParam
      ? referenceCategorySchema.safeParse(categoryParam)
      : null;
    if (parsedCategory && !parsedCategory.success) {
      return errorResponse("Invalid reference category", 400);
    }

    if (parsedCategory?.data === "CAMPAIGN_LORE" && !gameId) {
      return errorResponse("CAMPAIGN_LORE entries require a gameId", 400);
    }

    let isGameMaster = false;
    if (gameId) {
      const inGame = await userIsInGame(gameId, userId);
      if (!inGame) {
        return errorResponse("You are not part of this game", 403);
      }
      const game = await getGame(gameId);
      isGameMaster = game?.gameMaster === userId;
    }

    const entries = await getReferenceEntries({
      category: parsedCategory?.data,
      gameId: gameId ?? null,
    });

    const visibleEntries = isGameMaster
      ? entries
      : entries.filter((entry) => entry.access === "PLAYER");

    return NextResponse.json(visibleEntries, { status: 200 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "GET",
      route,
      message: "Error fetching reference entries",
      error,
      details,
    });
    return errorResponse("Error fetching reference entries", 500, details);
  }
});

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    const requestBody = await request.json();
    const { data: parsedBody, error } =
      referenceEntryCreateSchema.safeParse(requestBody);
    if (error) {
      return errorResponse(
        "Error parsing reference entry creation request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    if (parsedBody.gameId) {
      const game = await getGame(parsedBody.gameId);
      if (!game) {
        return errorResponse("Game not found", 404);
      }
      if (game.gameMaster !== userId) {
        return errorResponse(
          "Only the game master can create game reference entries",
          403
        );
      }
    }

    const entry = await createReferenceEntry(parsedBody);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "POST",
      route,
      message: "Error creating reference entry",
      error,
      details,
    });
    return errorResponse("Error creating reference entry", 500, details);
  }
});
