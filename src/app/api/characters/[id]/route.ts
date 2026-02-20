import { NextResponse } from "next/server";
import { deleteCharacter, getCharacter } from "@/app/lib/prisma/character";
import { auth } from "@/auth";
import { AuthNextRequest } from "@/app/lib/types/api";
import {
  deleteCharacterUserByCharacterId,
  characterBelongsToUser,
} from "@/app/lib/prisma/characterUser";
import { deleteCharacterInventory } from "@/app/lib/prisma/itemCharacter";
import logger from "@/logger";
import { serializeError } from "../../shared/errors";
import { errorResponse } from "../../shared/responses";
import {
  deletePathCharacter,
  getCharacterPaths,
} from "@/app/lib/prisma/pathCharacter";
import {
  deleteFeatureCharacter,
  getCharacterFeatures,
} from "@/app/lib/prisma/featureCharacter";
import {
  deleteGameCharacter,
  getCharacterGames,
} from "@/app/lib/prisma/gameCharacter";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/characters/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };

    if (!id || typeof id !== "string") {
      logger.error({
        method: "GET",
        route: "/api/characters/[id]",
        message: "Invalid character ID",
      });
      return errorResponse("Invalid character ID.", 400);
    }

    if (!characterBelongsToUser(id, request.auth.user.id)) {
      logger.error({
        method: "GET",
        route: "/api/characters/[id]",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters", 403);
    }

    const character = await getCharacter(id);

    if (!character) {
      logger.error({
        method: "GET",
        route: "/api/characters/[id]",
        message: "Character not found",
        characterId: id,
      });
      return errorResponse("Character not found", 404);
    }

    return NextResponse.json(character, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/characters/[id]",
      message: "Error fetching character",
      error,
    });
    return errorResponse(
      "Error fetching character",
      500,
      serializeError(error)
    );
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]",
        message: "Unauthorised",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };

    if (!id || typeof id !== "string") {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]",
        message: "Invalid character ID",
        characterId: id,
      });
      return errorResponse("Invalid character ID.", 400);
    }

    if (!characterBelongsToUser(id, request.auth.user.id)) {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters", 403);
    }

    const characterPaths = await getCharacterPaths(id);
    for (const path of characterPaths) {
      await deletePathCharacter(path.id);
    }
    const characterFeatures = await getCharacterFeatures(id);
    for (const feature of characterFeatures) {
      await deleteFeatureCharacter(feature.id);
    }
    const characterGames = await getCharacterGames(id);
    for (const game of characterGames) {
      await deleteGameCharacter(game.id);
    }
    await deleteCharacterUserByCharacterId(id);
    await deleteCharacterInventory(id);

    await deleteCharacter(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/characters/[id]",
      message: "Error deleting character",
      error,
    });
    return errorResponse(
      "Error deleting character",
      500,
      serializeError(error)
    );
  }
});
