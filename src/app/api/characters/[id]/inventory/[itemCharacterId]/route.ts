import { ITEM_LOCATION_CARRIED } from "@/app/lib/constants/inventory";
import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import {
  deleteItemCharacter,
  getCharacterInventory,
  updateItemCharacter,
} from "@/app/lib/prisma/itemCharacter";
import {
  type CharacterForCombatSync,
  computeCombatInfoUpdateForCharacter,
} from "@/app/lib/equipCombatUtils";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import { z } from "zod";

const equipSlotSchema = z.enum(["HAND", "FOOT", "BODY", "HEAD"]);
const patchBodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("equip"), slot: equipSlotSchema }),
  z.object({ action: z.literal("unequip"), slot: equipSlotSchema }),
  z.object({ action: z.literal("unequipAll") }),
  z.object({
    action: z.literal("setLocation"),
    itemLocation: z.string().min(1, "Location is required"),
  }),
]);

const SLOT_CAPACITY = 2;

type InventoryEntry = {
  equipSlots?: string[];
  item?: { equipSlotTypes?: string[]; equipSlotCost?: number | null } | null;
  itemLocation?: string | null;
};

function getUsedCapacityInSlot(
  inventory: InventoryEntry[],
  slot: string
): number {
  let sum = 0;
  for (const entry of inventory) {
    const cost = entry.item?.equipSlotCost ?? 1;
    const count = (entry.equipSlots ?? []).filter((s) => s === slot).length;
    sum += count * cost;
  }
  return sum;
}

function slotAllowsItem(
  slot: string,
  equipSlotTypes: string[] | undefined
): boolean {
  if (!equipSlotTypes?.length) return true;
  return equipSlotTypes.includes(slot);
}

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

    const equipSlots = (entry.equipSlots ?? []) as string[];
    const action = parsed.data.action;

    if (action === "equip") {
      const isCarried =
        (entry as InventoryEntry).itemLocation === ITEM_LOCATION_CARRIED ||
        (entry as InventoryEntry).itemLocation == null;
      if (!isCarried) {
        return errorResponse(
          "Only items you are carrying can be equipped",
          400
        );
      }
      const equippable =
        entry.item != null &&
        "equippable" in entry.item &&
        entry.item.equippable === true;
      if (!equippable) {
        return errorResponse("This item is not equippable", 400);
      }
      const slot = parsed.data.slot;
      const itemWithEquip = entry.item as {
        equipSlotTypes?: string[];
        equipSlotCost?: number | null;
      } | null;
      if (!slotAllowsItem(slot, itemWithEquip?.equipSlotTypes)) {
        return errorResponse("This item cannot be equipped in that slot", 400);
      }
      const itemCost = itemWithEquip?.equipSlotCost ?? 1;
      const carriedInventory = (inventory as InventoryEntry[]).filter(
        (e) =>
          e.itemLocation === ITEM_LOCATION_CARRIED || e.itemLocation == null
      );
      const usedCapacity = getUsedCapacityInSlot(carriedInventory, slot);
      if (usedCapacity + itemCost > SLOT_CAPACITY) {
        return errorResponse("That slot does not have enough space", 400);
      }
      if (equipSlots.length >= entry.quantity) {
        return errorResponse(
          "All copies of this item are already equipped",
          400
        );
      }
      const updatedSlots: string[] = [...equipSlots, slot];
      await updateItemCharacter(itemCharacterId, {
        equipSlots: updatedSlots,
        isEquipped: updatedSlots.length > 0,
      });
    } else if (action === "unequip") {
      const slot = parsed.data.slot;
      const idx = equipSlots.indexOf(slot);
      if (idx < 0) {
        return errorResponse("Item is not equipped in that slot", 400);
      }
      const updatedSlots = equipSlots.filter((_, i) => i !== idx);
      await updateItemCharacter(itemCharacterId, {
        equipSlots: updatedSlots,
        isEquipped: updatedSlots.length > 0,
      });
    } else if (action === "setLocation") {
      const { itemLocation } = parsed.data;
      const updateData: {
        itemLocation: string;
        equipSlots?: string[];
        isEquipped?: boolean;
      } = {
        itemLocation,
      };
      if (
        itemLocation !== ITEM_LOCATION_CARRIED &&
        (equipSlots?.length ?? 0) > 0
      ) {
        updateData.equipSlots = [];
        updateData.isEquipped = false;
      }
      await updateItemCharacter(itemCharacterId, updateData);
    } else {
      await updateItemCharacter(itemCharacterId, {
        equipSlots: [],
        isEquipped: false,
      });
    }

    const character = await getCharacter(id);
    if (character?.combatInformation) {
      const combatUpdate = computeCombatInfoUpdateForCharacter(
        character as CharacterForCombatSync
      );
      await updateCharacter(id, {
        combatInformation: {
          ...character.combatInformation,
          ...combatUpdate,
        },
      });
    }

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

    try {
      await deleteItemCharacter(itemCharacterId);
    } catch (error) {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]/equipment/[itemCharacterId]",
        message: "Error while deleting itemCharacter",
        itemCharacterId,
        error,
      });
      return errorResponse(
        "Failed to remove item. Please try again.",
        500,
        serializeError(error)
      );
    }

    const character = await getCharacter(id);
    if (character?.combatInformation) {
      const combatUpdate = computeCombatInfoUpdateForCharacter(
        character as CharacterForCombatSync
      );
      await updateCharacter(id, {
        combatInformation: {
          ...character.combatInformation,
          ...combatUpdate,
        },
      });
    }

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
