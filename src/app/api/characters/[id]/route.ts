import { deleteCharacter, getCharacter } from "@/app/lib/prisma/character";
import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import logger from "@/logger";
import {
  CharacterDeletionTransactionError,
  serializeError,
} from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

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

    if (!(await characterBelongsToUser(id, request.auth.user.id))) {
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

    if (!(await characterBelongsToUser(id, request.auth.user.id))) {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters", 403);
    }

    await deleteCharacter(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof CharacterDeletionTransactionError) {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]",
        message: "Character deletion transaction step failed",
        step: error.step,
        details: error.details,
      });
      return errorResponse(
        `Error while running ${error.step}`,
        500,
        error.details
      );
    }

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
