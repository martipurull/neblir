import { deleteItemCharacter } from "@/app/lib/prisma/itemCharacter";
import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { characterBelongsToUser } from "../../../checks";
import logger from "@/logger";

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]/equipment/[itemCharacterId]",
        message: "Unauthorised access attempt",
      });
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
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
      return NextResponse.json(
        { message: "Invalid character or itemCharacter ID" },
        { status: 400 }
      );
    }
    if (!characterBelongsToUser(request.auth?.user?.characters, id)) {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]/equipment/[itemCharacterId]",
        message: "Character does not belong to user",
        characterId: id,
      });
      return NextResponse.json(
        { message: "This is not one of your characters." },
        { status: 403 }
      );
    }

    await deleteItemCharacter(itemCharacterId).catch((error) => {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]/equipment/[itemCharacterId]",
        message: "Error while deleting itemCharacter",
        itemCharacterId,
        error,
      });
      return new NextResponse(
        `Error while deleting itemCharacter with id ${itemCharacterId}`,
        {
          status: 500,
        }
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
    return NextResponse.error();
  }
});
