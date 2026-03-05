import {
  deleteItemCharacter,
  getCharacterInventory,
  updateItemCharacter,
} from "@/app/lib/prisma/itemCharacter";
import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import { z } from "zod";

const equipSlotSchema = z.enum(["HAND", "FOOT", "BODY"]);
const patchBodySchema = z.object({
  equipSlot: equipSlotSchema.nullable(),
});

const MAX_ITEMS_PER_SLOT = 2;

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/inventory/[itemCharacterId]",
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
      return errorResponse("Invalid character or itemCharacter ID", 400);
    }
    if (!(await characterBelongsToUser(id, request.auth.user.id))) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const requestBody = await request.json();
    const parsed = patchBodySchema.safeParse(requestBody);
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }

    const inventory = await getCharacterInventory(id);
    const entry = inventory.find((e) => e.id === itemCharacterId);
    if (!entry) {
      return errorResponse("Item not found in character inventory", 404);
    }

    const equippable =
      entry.item != null &&
      "equippable" in entry.item &&
      entry.item.equippable === true;
    if (parsed.data.equipSlot != null && !equippable) {
      return errorResponse("This item is not equippable", 400);
    }

    if (parsed.data.equipSlot != null) {
      const inSlot = inventory.filter(
        (e) => e.equipSlot === parsed.data.equipSlot && e.id !== itemCharacterId
      );
      if (inSlot.length >= MAX_ITEMS_PER_SLOT) {
        return errorResponse(
          `That slot already has ${MAX_ITEMS_PER_SLOT} items`,
          400
        );
      }
    }

    await updateItemCharacter(itemCharacterId, {
      equipSlot: parsed.data.equipSlot,
      isEquipped: parsed.data.equipSlot != null,
    });

    const updated = await getCharacterInventory(id);
    const updatedEntry = updated.find((e) => e.id === itemCharacterId);
    return NextResponse.json(updatedEntry);
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/characters/[id]/inventory/[itemCharacterId]",
      message: "Error updating inventory entry",
      error,
    });
    return errorResponse(
      "Error updating inventory entry",
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
    if (!(await characterBelongsToUser(id, request.auth.user.id))) {
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
