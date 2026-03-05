import { ItemCharacter, ItemSourceType, Prisma } from "@prisma/client";
import { ObjectId } from "mongodb";
import { prisma } from "./client";

export async function createItemCharacter(
  data: Prisma.ItemCharacterUncheckedCreateInput
) {
  return prisma.itemCharacter.create({ data });
}

async function resolveItem(sourceType: ItemSourceType, itemId: string) {
  switch (sourceType) {
    case "GLOBAL_ITEM": {
      return prisma.item.findUnique({ where: { id: itemId } });
    }
    case "CUSTOM_ITEM": {
      return prisma.customItem.findUnique({ where: { id: itemId } });
    }
    case "UNIQUE_ITEM": {
      const uniqueItem = await prisma.uniqueItem.findUnique({
        where: { id: itemId },
      });
      if (!uniqueItem) return null;

      const template =
        uniqueItem.sourceType === "GLOBAL_ITEM"
          ? await prisma.item.findUnique({ where: { id: uniqueItem.itemId } })
          : await prisma.customItem.findUnique({
              where: { id: uniqueItem.itemId },
            });

      if (!template) return uniqueItem;

      return {
        ...template,
        ...(uniqueItem.nameOverride != null && {
          name: uniqueItem.nameOverride,
        }),
        ...(uniqueItem.descriptionOverride != null && {
          description: uniqueItem.descriptionOverride,
        }),
        ...(uniqueItem.attackRollOverride?.length && {
          attackRoll: uniqueItem.attackRollOverride,
        }),
        ...(uniqueItem.attackMeleeBonusOverride != null && {
          attackMeleeBonus: uniqueItem.attackMeleeBonusOverride,
        }),
        ...(uniqueItem.attackRangeBonusOverride != null && {
          attackRangeBonus: uniqueItem.attackRangeBonusOverride,
        }),
        ...(uniqueItem.attackThrowBonusOverride != null && {
          attackThrowBonus: uniqueItem.attackThrowBonusOverride,
        }),
        ...(uniqueItem.defenceMeleeBonusOverride != null && {
          defenceMeleeBonus: uniqueItem.defenceMeleeBonusOverride,
        }),
        ...(uniqueItem.defenceRangeBonusOverride != null && {
          defenceRangeBonus: uniqueItem.defenceRangeBonusOverride,
        }),
        ...(uniqueItem.gridAttackBonusOverride != null && {
          gridAttackBonus: uniqueItem.gridAttackBonusOverride,
        }),
        ...(uniqueItem.gridDefenceBonusOverride != null && {
          gridDefenceBonus: uniqueItem.gridDefenceBonusOverride,
        }),
        ...(uniqueItem.confCostOverride != null && {
          confCost: uniqueItem.confCostOverride,
        }),
        ...(uniqueItem.costInfoOverride != null && {
          costInfo: uniqueItem.costInfoOverride,
        }),
        ...(uniqueItem.damageOverride != null && {
          damage: uniqueItem.damageOverride,
        }),
        ...(uniqueItem.imageKeyOverride != null && {
          imageKey: uniqueItem.imageKeyOverride,
        }),
        ...(uniqueItem.notesOverride != null && {
          notes: uniqueItem.notesOverride,
        }),
        ...(uniqueItem.usageOverride != null && {
          usage: uniqueItem.usageOverride,
        }),
        ...(uniqueItem.weightOverride != null && {
          weight: uniqueItem.weightOverride,
        }),
        ...(uniqueItem.equippableOverride != null && {
          equippable: uniqueItem.equippableOverride,
        }),
        specialTag: uniqueItem.specialTag,
        _resolvedFrom: "UNIQUE_ITEM" as const,
        _uniqueItemId: uniqueItem.id,
      };
    }
    default:
      return null;
  }
}

export async function getCharacterInventory(characterId: string) {
  const records = await prisma.itemCharacter.findMany({
    where: { characterId },
  });

  const resolvedRecords = await Promise.all(
    records.map(async (record) => {
      const item = await resolveItem(record.sourceType, record.itemId);
      return { ...record, item };
    })
  );

  return resolvedRecords;
}

export async function hydrateItemCharacters(records: ItemCharacter[]) {
  return Promise.all(
    records.map(async (record) => {
      const item = await resolveItem(record.sourceType, record.itemId);
      return { ...record, item };
    })
  );
}

export async function updateItemCharacter(
  id: string,
  data: Prisma.ItemCharacterUpdateInput
) {
  return prisma.itemCharacter.update({ where: { id }, data });
}

export async function deleteItemCharacter(id: string) {
  return prisma.itemCharacter.delete({ where: { id } });
}

export async function deleteCharacterInventory(characterId: string) {
  return prisma.itemCharacter.deleteMany({ where: { characterId } });
}
