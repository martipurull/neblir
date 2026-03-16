import { addOrIncrementItemCharacter } from "@/app/lib/prisma/itemCharacter";
import { getGame } from "@/app/lib/prisma/game";
import { characterIsInGame } from "@/app/lib/prisma/gameCharacter";
import { addToInventorySchema } from "@/app/lib/types/item";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";
import { prisma } from "@/app/lib/prisma/client";
import { z } from "zod";

const giveItemBodySchema = addToInventorySchema.and(
  z.object({ characterId: z.string().min(1) })
);

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/games/[id]/give-item",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) return errorResponse("User ID not found", 400);

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== userId) {
      return errorResponse(
        "Only the game master can give items in this game",
        403
      );
    }

    const requestBody = await request.json();
    const parsed = giveItemBodySchema.safeParse(requestBody);
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }

    const { characterId, sourceType, itemId } = parsed.data;

    const inGame = await characterIsInGame(gameId, characterId);
    if (!inGame) {
      return errorResponse("Character is not in this game", 403);
    }

    if (sourceType === "CUSTOM_ITEM") {
      const customItem = await prisma.customItem.findUnique({
        where: { id: itemId },
        select: { gameId: true },
      });
      if (customItem?.gameId !== gameId) {
        return errorResponse("Custom item does not belong to this game", 403);
      }
    }

    if (sourceType === "UNIQUE_ITEM") {
      const uniqueItem = await prisma.uniqueItem.findUnique({
        where: { id: itemId },
        select: { gameId: true },
      });
      if (uniqueItem?.gameId !== gameId) {
        return errorResponse("Unique item does not belong to this game", 403);
      }
    }

    await addOrIncrementItemCharacter(characterId, sourceType, itemId);

    return NextResponse.json(
      { message: "Item given to character" },
      { status: 201 }
    );
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games/[id]/give-item",
      message: "Error giving item",
      error,
    });
    return errorResponse(
      "Error giving item to character",
      500,
      serializeError(error)
    );
  }
});
