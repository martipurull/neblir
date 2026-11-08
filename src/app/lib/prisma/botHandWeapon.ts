import { parseBotItemLocation } from "@/app/lib/constants/inventory";
import { isItemInventoryOperational } from "@/app/lib/types/item";
import type { BotHandWeapon } from "@/app/lib/botCombatRoll";
import type { ItemStatus } from "@/app/lib/types/item";
import { prisma } from "./client";
import { hydrateItemCharacters } from "./itemCharacter";

type WeaponItem = {
  name?: string | null;
  attackRoll?: string[] | null;
  attackMeleeBonus?: number | null;
  attackRangeBonus?: number | null;
  maxUses?: number | null;
  damage?: {
    numberOfDice?: number | null;
    diceType?: number | null;
  } | null;
};

export async function loadBotHandWeapon(args: {
  characterId: string;
  botCharacterId: string;
  itemCharacterId: string;
}): Promise<BotHandWeapon | null> {
  const row = await prisma.itemCharacter.findFirst({
    where: { id: args.itemCharacterId, characterId: args.characterId },
  });
  if (!row) return null;
  const [hydrated] = await hydrateItemCharacters([row]);
  const item = hydrated?.item as WeaponItem | null | undefined;
  const place = parseBotItemLocation(row.itemLocation);
  const handEquipped =
    place?.place === "carried" &&
    place.botCharacterId === args.botCharacterId &&
    (row.botEquipSlots ?? []).includes("HAND");
  const damage =
    item?.damage?.numberOfDice != null && item.damage.diceType != null
      ? {
          numberOfDice: item.damage.numberOfDice,
          diceType: item.damage.diceType,
        }
      : null;
  const status = row.status as ItemStatus;
  return {
    itemCharacterId: row.id,
    displayName: row.customName?.trim() ?? item?.name?.trim() ?? "Weapon",
    attackModes: item?.attackRoll ?? [],
    attackMeleeBonus: item?.attackMeleeBonus ?? 0,
    attackRangeBonus: item?.attackRangeBonus ?? 0,
    maxUses: item?.maxUses ?? null,
    currentUses: row.currentUses ?? 0,
    operational: isItemInventoryOperational(status),
    handEquipped,
    damage,
  };
}

export async function spendBotWeaponUse(
  itemCharacterId: string,
  currentUses: number
): Promise<void> {
  await prisma.itemCharacter.update({
    where: { id: itemCharacterId },
    data: { currentUses: Math.max(0, currentUses - 1) },
  });
}
