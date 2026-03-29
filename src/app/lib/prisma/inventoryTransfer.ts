import type { ItemSourceType, Prisma } from "@prisma/client";
import { ITEM_LOCATION_CARRIED } from "@/app/lib/constants/inventory";
import { prisma } from "./client";
import { characterIsInGame, charactersShareAnyGame } from "./gameCharacter";
import { getMaxUsesForItem } from "./itemCharacter";

export class InventoryTransferConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InventoryTransferConflictError";
  }
}

/** Split `currentUses` across a stack when moving `transferQty` of `stackQty` units. */
export function splitStackUses(
  currentUses: number,
  stackQuantity: number,
  transferQuantity: number
): { transferred: number; remaining: number } {
  if (stackQuantity <= 0) return { transferred: 0, remaining: currentUses };
  const transferred = Math.floor(
    (currentUses * transferQuantity) / stackQuantity
  );
  const remaining = currentUses - transferred;
  return { transferred, remaining };
}

/** After reducing stack size, equipped copies beyond the new quantity are dropped. */
export function equipSlotsAfterTransferOut(
  equipSlots: string[],
  newQuantity: number
): string[] {
  const cap = Math.max(0, newQuantity);
  return [...(equipSlots ?? [])].slice(0, cap);
}

function clampUses(value: number, maxUses: number | null): number {
  if (maxUses == null) return value;
  return Math.min(Math.max(0, value), maxUses);
}

export async function validateInventoryTransferParties(
  fromCharacterId: string,
  toCharacterId: string,
  sourceType: ItemSourceType,
  itemId: string
): Promise<{ message: string; status: number } | null> {
  if (fromCharacterId === toCharacterId) {
    return {
      message: "Cannot give an item to the same character",
      status: 400,
    };
  }

  const recipientExists = await prisma.character.findUnique({
    where: { id: toCharacterId },
    select: { id: true },
  });
  if (!recipientExists) {
    return { message: "Recipient character not found", status: 404 };
  }

  if (sourceType === "CUSTOM_ITEM") {
    const custom = await prisma.customItem.findUnique({
      where: { id: itemId },
      select: { gameId: true },
    });
    if (!custom) {
      return { message: "Custom item not found", status: 404 };
    }
    const [fromIn, toIn] = await Promise.all([
      characterIsInGame(custom.gameId, fromCharacterId),
      characterIsInGame(custom.gameId, toCharacterId),
    ]);
    if (!fromIn || !toIn) {
      return {
        message:
          "That item can only be given to another character in the same custom-item game",
        status: 403,
      };
    }
    return null;
  }

  if (sourceType === "UNIQUE_ITEM") {
    const unique = await prisma.uniqueItem.findUnique({
      where: { id: itemId },
      select: { gameId: true },
    });
    if (!unique) {
      return { message: "Unique item not found", status: 404 };
    }
    if (unique.gameId != null) {
      const [fromIn, toIn] = await Promise.all([
        characterIsInGame(unique.gameId, fromCharacterId),
        characterIsInGame(unique.gameId, toCharacterId),
      ]);
      if (!fromIn || !toIn) {
        return {
          message:
            "That item can only be given to another character registered for its game",
          status: 403,
        };
      }
    } else {
      const share = await charactersShareAnyGame(
        fromCharacterId,
        toCharacterId
      );
      if (!share) {
        return {
          message:
            "Recipient must be in a game that this character is registered for",
          status: 403,
        };
      }
    }
    return null;
  }

  const share = await charactersShareAnyGame(fromCharacterId, toCharacterId);
  if (!share) {
    return {
      message:
        "Recipient must be in a game that this character is registered for",
      status: 403,
    };
  }
  return null;
}

async function transferWithinClient(
  db: Prisma.TransactionClient,
  args: {
    fromCharacterId: string;
    toCharacterId: string;
    itemCharacterId: string;
    quantity: number;
    maxUses: number | null;
  }
): Promise<void> {
  const { fromCharacterId, toCharacterId, itemCharacterId, quantity, maxUses } =
    args;

  const row = await db.itemCharacter.findFirst({
    where: { id: itemCharacterId, characterId: fromCharacterId },
  });
  if (!row) {
    throw new InventoryTransferConflictError(
      "Item is no longer in this character’s inventory"
    );
  }
  if (row.quantity < quantity) {
    throw new InventoryTransferConflictError(
      "Not enough quantity left to transfer; refresh and try again"
    );
  }

  const currentUses = row.currentUses ?? 0;
  const { transferred: transferredUsesRaw, remaining: giverUsesRaw } =
    splitStackUses(currentUses, row.quantity, quantity);
  const transferredUses = clampUses(transferredUsesRaw, maxUses);
  const giverUses = clampUses(giverUsesRaw, maxUses);

  const newGiverQty = row.quantity - quantity;
  const newGiverEquip = equipSlotsAfterTransferOut(
    row.equipSlots ?? [],
    newGiverQty
  );

  if (newGiverQty === 0) {
    await db.itemCharacter.delete({ where: { id: row.id } });
  } else {
    await db.itemCharacter.update({
      where: { id: row.id },
      data: {
        quantity: newGiverQty,
        equipSlots: newGiverEquip,
        isEquipped: newGiverEquip.length > 0,
        currentUses: giverUses,
      },
    });
  }

  const existingRecipient = await db.itemCharacter.findFirst({
    where: {
      characterId: toCharacterId,
      sourceType: row.sourceType,
      itemId: row.itemId,
    },
  });

  if (existingRecipient) {
    const mergedUses = clampUses(
      (existingRecipient.currentUses ?? 0) + transferredUses,
      maxUses
    );
    await db.itemCharacter.update({
      where: { id: existingRecipient.id },
      data: {
        quantity: { increment: quantity },
        currentUses: mergedUses,
      },
    });
  } else {
    await db.itemCharacter.create({
      data: {
        characterId: toCharacterId,
        sourceType: row.sourceType,
        itemId: row.itemId,
        quantity,
        currentUses: transferredUses,
        customName: row.customName,
        status: row.status,
        itemLocation: ITEM_LOCATION_CARRIED,
        equipSlots: [],
        isEquipped: false,
      },
    });
  }
}

export async function performInventoryItemTransfer(args: {
  fromCharacterId: string;
  toCharacterId: string;
  itemCharacterId: string;
  quantity: number;
}): Promise<void> {
  const entry = await prisma.itemCharacter.findFirst({
    where: {
      id: args.itemCharacterId,
      characterId: args.fromCharacterId,
    },
  });
  if (!entry) {
    throw new Error("ITEM_NOT_FOUND");
  }

  const maxUses = await getMaxUsesForItem(entry.sourceType, entry.itemId);

  await prisma.$transaction(async (tx) => {
    await transferWithinClient(tx, { ...args, maxUses });
  });
}
