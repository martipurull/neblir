import { getCharacter } from "@/app/lib/prisma/character";
import { getCustomItem } from "@/app/lib/prisma/customItem";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import {
  addOrIncrementItemCharacter,
  getEffectiveMaxUsesForUniqueCreate,
} from "@/app/lib/prisma/itemCharacter";
import { getItem } from "@/app/lib/prisma/item";
import {
  createUniqueItem,
  prismaDataFromUniqueItemCreate,
} from "@/app/lib/prisma/uniqueItem";
import { uniqueItemCreateSchema } from "@/app/lib/types/item";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";

/**
 * Create a unique item for this character and add it to inventory ("On Hand").
 * Character owner can use this endpoint.
 */
export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id: characterId } = (await params) as { id: string };
    if (!characterId || typeof characterId !== "string") {
      return errorResponse("Invalid character ID", 400);
    }

    if (!(await characterBelongsToUser(characterId, request.auth.user.id))) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      uniqueItemCreateSchema.safeParse(requestBody);
    if (error) {
      return errorResponse(
        "Error parsing unique item creation request",
        400,
        error.issues.map((i) => i.message).join(". ")
      );
    }

    const character = await getCharacter(characterId);
    if (!character) {
      return errorResponse("Character not found", 404);
    }

    let effectiveGameId = parsedBody.gameId;
    if (parsedBody.sourceType === "CUSTOM_ITEM") {
      const template = await getCustomItem(parsedBody.itemId);
      if (!template)
        return errorResponse("Template custom item not found", 404);
      effectiveGameId = template.gameId;
    }
    if (parsedBody.sourceType === "CUSTOM_ITEM" && effectiveGameId) {
      const game = await getGame(effectiveGameId);
      if (!game) return errorResponse("Game not found", 404);
      const inGame = await userIsInGame(effectiveGameId, request.auth.user.id);
      if (!inGame) {
        return errorResponse(
          "You must be part of the relevant game for this custom item.",
          403
        );
      }
    }

    if (parsedBody.sourceType === "GLOBAL_ITEM") {
      const template = await getItem(parsedBody.itemId);
      if (!template) return errorResponse("Template item not found", 404);
    }

    if (parsedBody.sourceType === "STANDALONE" && parsedBody.gameId) {
      const inGame = await userIsInGame(
        parsedBody.gameId,
        request.auth.user.id
      );
      if (!inGame) {
        return errorResponse(
          "You must be part of a game to link a standalone item to it.",
          403
        );
      }
    }

    const uniqueItem = await createUniqueItem(
      prismaDataFromUniqueItemCreate(
        request.auth.user.id,
        effectiveGameId,
        parsedBody
      )
    );

    const initialCurrentUsesMax =
      await getEffectiveMaxUsesForUniqueCreate(parsedBody);
    await addOrIncrementItemCharacter(
      characterId,
      "UNIQUE_ITEM",
      uniqueItem.id,
      { initialCurrentUsesMax }
    );

    return NextResponse.json({ id: uniqueItem.id }, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/characters/[id]/unique-items",
      message: "Error creating unique item for character",
      error,
    });
    return errorResponse(
      "Error creating unique item for character",
      500,
      serializeError(error)
    );
  }
});
