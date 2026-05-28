import { getCharacter } from "@/app/lib/prisma/character";
import { getItem } from "@/app/lib/prisma/item";
import {
  getCharacterPaths,
  updatePathCharacter,
} from "@/app/lib/prisma/pathCharacter";
import { soldierFavouriteWeaponUpdateSchema } from "@/app/lib/types/path";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { PathName } from "@prisma/client";
import { NextResponse } from "next/server";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import { logger } from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/favourite-weapon",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      return errorResponse("Invalid character ID", 400);
    }

    if (!(await characterBelongsToUser(id, request.auth.user.id))) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const requestBody = await request.json();
    const parseResult =
      soldierFavouriteWeaponUpdateSchema.safeParse(requestBody);
    if (!parseResult.success) {
      return errorResponse(
        "Error parsing favourite weapon update request",
        400,
        parseResult.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const { pathId, favouriteWeaponItemId } = parseResult.data;
    const pathCharacters = await getCharacterPaths(id);
    const pathCharacter = pathCharacters.find((pc) => pc.pathId === pathId);
    if (!pathCharacter) {
      return errorResponse("Path not found on this character", 404);
    }
    if (pathCharacter.path.name !== PathName.SOLDIER) {
      return errorResponse(
        "Favourite weapon can only be set for the Soldier path",
        400
      );
    }

    if (favouriteWeaponItemId != null) {
      const item = await getItem(favouriteWeaponItemId);
      if (!item) {
        return errorResponse("Weapon not found in catalogue", 404);
      }
      if (item.type !== "WEAPON") {
        return errorResponse("Selected catalogue item is not a weapon", 400);
      }
    }

    await updatePathCharacter(pathCharacter.id, {
      favouriteWeapon:
        favouriteWeaponItemId != null
          ? { connect: { id: favouriteWeaponItemId } }
          : { disconnect: true },
    });

    const fullCharacter = await getCharacter(id);
    if (!fullCharacter) {
      return errorResponse("Character not found after update", 500);
    }

    return NextResponse.json(fullCharacter, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/characters/[id]/favourite-weapon",
      message: "Error updating favourite weapon",
      error,
    });
    return errorResponse(
      "Error updating favourite weapon",
      500,
      serializeError(error)
    );
  }
});
