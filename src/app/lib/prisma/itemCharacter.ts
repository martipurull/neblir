import type { ItemCharacter, ItemSourceType, Prisma } from "@prisma/client";
import { ITEM_LOCATION_CARRIED } from "@/app/lib/constants/inventory";
import {
  PRISMA_TO_ATTRIBUTE_PATH_API,
  PRISMA_TO_GENERAL_SKILL_API,
} from "@/app/lib/itemModifierEnums";
import {
  mapPrismaCustomItemToApi,
  mapPrismaItemToApi,
} from "@/app/lib/itemModifierPrisma";
import { prisma } from "./client";
import { buildStandaloneResolvedItem } from "./uniqueItem";

export async function createItemCharacter(
  data: Prisma.ItemCharacterUncheckedCreateInput
) {
  return prisma.itemCharacter.create({ data });
}

export async function addOrIncrementItemCharacter(
  characterId: string,
  sourceType: ItemSourceType,
  itemId: string
) {
  const existing = await prisma.itemCharacter.findFirst({
    where: { characterId, sourceType, itemId },
  });
  if (existing) {
    return prisma.itemCharacter.update({
      where: { id: existing.id },
      data: { quantity: { increment: 1 } },
    });
  }
  const maxUses = await getMaxUsesForItem(sourceType, itemId);
  return prisma.itemCharacter.create({
    data: {
      characterId,
      sourceType,
      itemId,
      quantity: 1,
      currentUses: maxUses ?? 0,
      itemLocation: ITEM_LOCATION_CARRIED,
    },
  });
}

/** Resolve effective maxUses for an item (template or unique override). */
export async function getMaxUsesForItem(
  sourceType: ItemSourceType,
  itemId: string
): Promise<number | null> {
  switch (sourceType) {
    case "GLOBAL_ITEM": {
      const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { maxUses: true },
      });
      return item?.maxUses ?? null;
    }
    case "CUSTOM_ITEM": {
      const item = await prisma.customItem.findUnique({
        where: { id: itemId },
        select: { maxUses: true },
      });
      return item?.maxUses ?? null;
    }
    case "UNIQUE_ITEM": {
      const uniqueItem = await prisma.uniqueItem.findUnique({
        where: { id: itemId },
        select: { maxUsesOverride: true, itemId: true, sourceType: true },
      });
      if (!uniqueItem) return null;
      if (uniqueItem.maxUsesOverride != null) return uniqueItem.maxUsesOverride;
      if (uniqueItem.sourceType === "STANDALONE" || uniqueItem.itemId == null) {
        return null;
      }
      const template =
        uniqueItem.sourceType === "GLOBAL_ITEM"
          ? await prisma.item.findUnique({
              where: { id: uniqueItem.itemId },
              select: { maxUses: true },
            })
          : await prisma.customItem.findUnique({
              where: { id: uniqueItem.itemId },
              select: { maxUses: true },
            });
      return template?.maxUses ?? null;
    }
    default:
      return null;
  }
}

async function resolveItem(sourceType: ItemSourceType, itemId: string) {
  switch (sourceType) {
    case "GLOBAL_ITEM": {
      const row = await prisma.item.findUnique({ where: { id: itemId } });
      return row ? mapPrismaItemToApi(row) : null;
    }
    case "CUSTOM_ITEM": {
      const row = await prisma.customItem.findUnique({ where: { id: itemId } });
      return row ? mapPrismaCustomItemToApi(row) : null;
    }
    case "UNIQUE_ITEM": {
      const uniqueItem = await prisma.uniqueItem.findUnique({
        where: { id: itemId },
      });
      if (!uniqueItem) return null;

      if (uniqueItem.sourceType === "STANDALONE") {
        return buildStandaloneResolvedItem(uniqueItem);
      }

      if (uniqueItem.itemId == null) return uniqueItem;

      const template =
        uniqueItem.sourceType === "GLOBAL_ITEM"
          ? await prisma.item.findUnique({ where: { id: uniqueItem.itemId } })
          : await prisma.customItem.findUnique({
              where: { id: uniqueItem.itemId },
            });

      if (!template) return uniqueItem;

      const templateApi =
        "gameId" in template
          ? mapPrismaCustomItemToApi(template)
          : mapPrismaItemToApi(template);

      return {
        ...templateApi,
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
        ...(uniqueItem.effectiveRangeOverride != null && {
          effectiveRange: uniqueItem.effectiveRangeOverride,
        }),
        ...(uniqueItem.maxRangeOverride != null && {
          maxRange: uniqueItem.maxRangeOverride,
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
        ...("equipSlotTypesOverride" in uniqueItem &&
          uniqueItem.equipSlotTypesOverride != null && {
            equipSlotTypes: Array.isArray(uniqueItem.equipSlotTypesOverride)
              ? (uniqueItem.equipSlotTypesOverride as string[])
              : [],
          }),
        ...("equipSlotCostOverride" in uniqueItem &&
          uniqueItem.equipSlotCostOverride != null && {
            equipSlotCost: uniqueItem.equipSlotCostOverride as number,
          }),
        ...(uniqueItem.maxUsesOverride != null && {
          maxUses: uniqueItem.maxUsesOverride,
        }),
        ...(uniqueItem.modifiesAttributeOverride != null && {
          modifiesAttribute:
            PRISMA_TO_ATTRIBUTE_PATH_API[uniqueItem.modifiesAttributeOverride],
        }),
        ...(uniqueItem.attributeModOverride != null && {
          attributeMod: uniqueItem.attributeModOverride,
        }),
        ...(uniqueItem.modifiesSkillOverride != null && {
          modifiesSkill:
            PRISMA_TO_GENERAL_SKILL_API[uniqueItem.modifiesSkillOverride],
        }),
        ...(uniqueItem.skillModOverride != null && {
          skillMod: uniqueItem.skillModOverride,
        }),
        ...(uniqueItem.isSpeedAlteredOverride != null && {
          isSpeedAltered: uniqueItem.isSpeedAlteredOverride,
        }),
        specialTag: uniqueItem.specialTag,
        _resolvedFrom: "UNIQUE_ITEM" as const,
        _uniqueItemId: uniqueItem.id,
        ...(uniqueItem.gameId != null && { gameId: uniqueItem.gameId }),
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
