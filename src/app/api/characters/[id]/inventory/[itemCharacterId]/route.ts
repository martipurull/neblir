import { ITEM_LOCATION_CARRIED } from "@/app/lib/constants/inventory";
import {
  getAutoEquipSlotAdds,
  getEquippedInstanceCount,
  isWithinSlotCapacity,
  pickFirstFlexibleEquipSlot,
} from "@/app/lib/equipUtils";
import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import {
  deleteItemCharacter,
  getCharacterInventory,
  getMaxUsesForItem,
  updateItemCharacter,
} from "@/app/lib/prisma/itemCharacter";
import {
  type CharacterForCombatSync,
  computeCombatInfoUpdateForCharacter,
  equipViolatesSingleArmourRule,
} from "@/app/lib/equipCombatUtils";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import {
  isItemInventoryOperational,
  itemStatusSchema,
} from "@/app/lib/types/item";
import { z } from "zod";

const equipSlotSchema = z.enum(["HAND", "FOOT", "BODY", "HEAD", "BRAIN"]);
const patchBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("equip"),
    slot: equipSlotSchema.optional(),
  }),
  z.object({ action: z.literal("unequip"), slot: equipSlotSchema }),
  z.object({ action: z.literal("unequipAll") }),
  z.object({
    action: z.literal("setLocation"),
    itemLocation: z.string().min(1, "Location is required"),
  }),
  z.object({
    action: z.literal("setCurrentUses"),
    currentUses: z.number().int().min(0),
  }),
  z.object({ action: z.literal("decrementUse") }),
  z.object({
    action: z.literal("setStatus"),
    status: itemStatusSchema,
  }),
]);

type InventoryEntry = {
  id: string;
  equipSlots?: string[];
  item?: {
    equipSlotTypes?: string[];
    equipSlotCost?: number | null;
    defenceMeleeBonus?: number | null;
    defenceRangeBonus?: number | null;
  } | null;
  itemLocation?: string | null;
};

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
      if (!isItemInventoryOperational(entry.status)) {
        return errorResponse(
          "Broken or unusable items cannot be equipped. Repair the item first.",
          400
        );
      }
      const requestedSlot = parsed.data.slot;
      const itemWithEquip = entry.item as {
        equipSlotTypes?: string[];
        equipSlotCost?: number | null;
        defenceMeleeBonus?: number | null;
        defenceRangeBonus?: number | null;
      } | null;
      const equipSlotTypes = itemWithEquip?.equipSlotTypes;
      const carriedInventory = (inventory as InventoryEntry[]).filter(
        (e) =>
          e.itemLocation === ITEM_LOCATION_CARRIED || e.itemLocation == null
      );
      const instancesEquipped = getEquippedInstanceCount(
        equipSlots,
        equipSlotTypes
      );
      if (instancesEquipped >= entry.quantity) {
        return errorResponse(
          "All copies of this item are already equipped",
          400
        );
      }

      const typesList = equipSlotTypes?.filter(Boolean) ?? [];
      if (requestedSlot != null && typesList.length > 1) {
        return errorResponse(
          "This item must be equipped to all of its slots at once",
          400
        );
      }

      let slotsToAdd: string[];

      if (requestedSlot != null) {
        const slot = requestedSlot;
        if (!slotAllowsItem(slot, itemWithEquip?.equipSlotTypes)) {
          return errorResponse(
            "This item cannot be equipped in that slot",
            400
          );
        }
        slotsToAdd = [slot];
      } else if (typesList.length === 0) {
        const flex = pickFirstFlexibleEquipSlot(
          carriedInventory,
          itemCharacterId,
          equipSlots
        );
        if (flex == null) {
          return errorResponse(
            "No equipment slot has enough free space. Unequip something and try again.",
            400
          );
        }
        slotsToAdd = [flex];
      } else {
        slotsToAdd = getAutoEquipSlotAdds(equipSlots, equipSlotTypes);
      }

      const updatedSlots: string[] = [...equipSlots, ...slotsToAdd];
      if (
        !isWithinSlotCapacity(carriedInventory, itemCharacterId, updatedSlots)
      ) {
        return errorResponse(
          "Not enough free space on the slots this item needs. Unequip something and try again.",
          400
        );
      }

      if (
        equipViolatesSingleArmourRule({
          carriedInventory,
          itemCharacterId,
          equipSlotsBefore: equipSlots,
          slotsToAdd,
          item: itemWithEquip,
          equipSlotTypes,
        })
      ) {
        return errorResponse(
          "You already have body armour equipped. Unequip it before wearing another suit.",
          400
        );
      }

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
    } else if (action === "setCurrentUses") {
      const { currentUses } = parsed.data;
      if (!isItemInventoryOperational(entry.status) && currentUses > 0) {
        return errorResponse(
          "Damaged items cannot hold charges. Set the item to functional first.",
          400
        );
      }
      const maxUses = await getMaxUsesForItem(entry.sourceType, entry.itemId);
      if (maxUses != null && currentUses > maxUses) {
        return errorResponse(
          `currentUses cannot exceed maxUses (${maxUses})`,
          400
        );
      }
      await updateItemCharacter(itemCharacterId, { currentUses });
    } else if (action === "decrementUse") {
      const current = entry.currentUses ?? 0;
      const next = Math.max(0, current - 1);
      await updateItemCharacter(itemCharacterId, { currentUses: next });
    } else if (action === "setStatus") {
      const nextStatus = parsed.data.status;
      await updateItemCharacter(itemCharacterId, {
        status: nextStatus,
        ...(!isItemInventoryOperational(nextStatus)
          ? {
              currentUses: 0,
              equipSlots: [],
              isEquipped: false,
            }
          : {}),
      });
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
