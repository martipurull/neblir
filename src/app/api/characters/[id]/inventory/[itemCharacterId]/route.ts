import { deleteItemCharacter } from "@/app/lib/prisma/itemCharacter";
import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]/equipment/[itemCharacterId]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id, itemCharacterId } = (await params) as {
      id: string;
      itemCharacterId: string;
    };
    if (
      !id ||
      typeof id !== "string" ||
      !itemCharacterId ||
      typeof itemCharacterId !== "string"
    ) {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]/equipment/[itemCharacterId]",
        message: "Invalid character or itemCharacter ID",
        characterId: id,
        itemCharacterId,
      });
      return errorResponse("Invalid character or itemCharacter ID", 400);
    }
    if (!characterBelongsToUser(id, request.auth.user.id)) {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]/equipment/[itemCharacterId]",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters.", 403);
    }

    await deleteItemCharacter(itemCharacterId).catch((error) => {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]/equipment/[itemCharacterId]",
        message: "Error while deleting itemCharacter",
        itemCharacterId,
        error,
      });
      return errorResponse(
        `Error while deleting itemCharacter with id ${itemCharacterId}`,
        500
      );
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/characters/[id]/equipment/[itemCharacterId]",
      message: "Error deleting item from equipment",
      error,
    });
    return errorResponse(
      "Error deleting item from equipment",
      500,
      serializeError(error)
    );
  }
});
