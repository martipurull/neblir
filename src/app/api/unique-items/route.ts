import { getGame } from "@/app/lib/prisma/game";
import {
  createUniqueItem,
  prismaDataFromUniqueItemCreate,
} from "@/app/lib/prisma/uniqueItem";
import { uniqueItemCreateSchema } from "@/app/lib/types/item";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../shared/errors";
import { errorResponse } from "../shared/responses";

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/unique-items",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) return errorResponse("User ID not found", 400);

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      uniqueItemCreateSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "POST",
        route: "/api/unique-items",
        message: "Error parsing unique item creation request",
        details: error,
      });
      return errorResponse(
        "Error parsing unique item creation request",
        400,
        error.issues.map((i) => i.message).join(". ")
      );
    }

    if (parsedBody.gameId) {
      const game = await getGame(parsedBody.gameId);
      if (!game) return errorResponse("Game not found", 404);
      if (game.gameMaster !== userId) {
        return errorResponse(
          "Only the game master can create unique items for this game",
          403
        );
      }
    }

    const effectiveGameId = parsedBody.gameId;
    if (parsedBody.sourceType === "CUSTOM_ITEM" && !effectiveGameId) {
      return errorResponse(
        "gameId is required when creating from a custom item.",
        400
      );
    }
    const item = await createUniqueItem(
      prismaDataFromUniqueItemCreate(userId, effectiveGameId, parsedBody)
    );

    return NextResponse.json({ id: item.id }, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/unique-items",
      message: "Error creating unique item",
      error,
    });
    return errorResponse(
      "Error creating unique item",
      500,
      serializeError(error)
    );
  }
});
