import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import {
  type CharacterForCombatSync,
  computeCombatInfoUpdateForCharacter,
} from "@/app/lib/equipCombatUtils";
import {
  InventoryTransferConflictError,
  performInventoryItemTransfer,
  validateInventoryTransferParties,
} from "@/app/lib/prisma/inventoryTransfer";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../../../shared/errors";
import { errorResponse } from "../../../../../shared/responses";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import { prisma } from "@/app/lib/prisma/client";
import { z } from "zod";

const transferBodySchema = z.object({
  toCharacterId: z.string().min(1, "Recipient is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

async function syncCombatForCharacter(characterId: string) {
  const character = await getCharacter(characterId);
  if (character?.combatInformation) {
    const combatUpdate = computeCombatInfoUpdateForCharacter(
      character as CharacterForCombatSync
    );
    await updateCharacter(characterId, {
      combatInformation: {
        ...character.combatInformation,
        ...combatUpdate,
      },
    });
  }
}

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/inventory/[itemCharacterId]/transfer",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id: fromCharacterId, itemCharacterId } = (await params) as {
      id: string;
      itemCharacterId: string;
    };
    if (
      !fromCharacterId ||
      typeof fromCharacterId !== "string" ||
      !itemCharacterId ||
      typeof itemCharacterId !== "string"
    ) {
      return errorResponse("Invalid character or inventory entry ID", 400);
    }

    if (
      !(await characterBelongsToUser(fromCharacterId, request.auth.user.id))
    ) {
      return errorResponse("This is not one of your characters.", 403);
    }

    const requestBody = await request.json();
    const parsed = transferBodySchema.safeParse(requestBody);
    if (!parsed.success) {
      return errorResponse(
        "Invalid request body",
        400,
        parsed.error.issues.map((i) => i.message).join(". ")
      );
    }

    const { toCharacterId, quantity } = parsed.data;

    const entry = await prisma.itemCharacter.findFirst({
      where: { id: itemCharacterId, characterId: fromCharacterId },
    });
    if (!entry) {
      return errorResponse("Item not found in character inventory", 404);
    }

    if (quantity > entry.quantity) {
      return errorResponse(
        "Quantity cannot exceed the amount in this stack",
        400
      );
    }

    const partyError = await validateInventoryTransferParties(
      fromCharacterId,
      toCharacterId,
      entry.sourceType,
      entry.itemId
    );
    if (partyError) {
      return errorResponse(partyError.message, partyError.status);
    }

    try {
      await performInventoryItemTransfer({
        fromCharacterId,
        toCharacterId,
        itemCharacterId,
        quantity,
      });
    } catch (e) {
      if (e instanceof Error && e.message === "ITEM_NOT_FOUND") {
        return errorResponse("Item not found in character inventory", 404);
      }
      if (e instanceof InventoryTransferConflictError) {
        return errorResponse(e.message, 409);
      }
      throw e;
    }

    await syncCombatForCharacter(fromCharacterId);
    await syncCombatForCharacter(toCharacterId);

    return NextResponse.json({ message: "Item transferred" }, { status: 200 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/characters/[id]/inventory/[itemCharacterId]/transfer",
      message: "Error transferring inventory item",
      error,
    });
    return errorResponse("Error transferring item", 500, serializeError(error));
  }
});
