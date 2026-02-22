import { Prisma } from "@prisma/client";
import { prisma } from "./client";

export async function createUniqueItem(
  data: Prisma.UniqueItemUncheckedCreateInput
) {
  return prisma.uniqueItem.create({ data });
}

export async function getUniqueItem(id: string) {
  return prisma.uniqueItem.findUnique({ where: { id } });
}

function applyUniqueItemOverrides(
  uniqueItem: NonNullable<Awaited<ReturnType<typeof getUniqueItem>>>,
  templateItem: Record<string, unknown>
) {
  return {
    ...templateItem,
    ...(uniqueItem.nameOverride != null && { name: uniqueItem.nameOverride }),
    ...(uniqueItem.descriptionOverride != null && {
      description: uniqueItem.descriptionOverride,
    }),
    ...(uniqueItem.attackRollOverride?.length && {
      attackRoll: uniqueItem.attackRollOverride,
    }),
    ...(uniqueItem.attackBonusOverride != null && {
      attackBonus: uniqueItem.attackBonusOverride,
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
  };
}

export async function getResolvedUniqueItem(id: string) {
  const uniqueItem = await getUniqueItem(id);
  if (!uniqueItem) {
    return null;
  }

  const templateItem =
    uniqueItem.sourceType === "GLOBAL_ITEM"
      ? await prisma.item.findUnique({ where: { id: uniqueItem.itemId } })
      : await prisma.customItem.findUnique({
          where: { id: uniqueItem.itemId },
        });

  if (!templateItem) {
    return {
      ...uniqueItem,
      templateItem: null,
      resolvedItem: null,
    };
  }

  return {
    ...uniqueItem,
    templateItem,
    resolvedItem: applyUniqueItemOverrides(uniqueItem, templateItem),
  };
}

export async function updateUniqueItem(
  id: string,
  data: Prisma.UniqueItemUpdateInput
) {
  return prisma.uniqueItem.update({ where: { id }, data });
}

export async function deleteUniqueItem(id: string) {
  return prisma.uniqueItem.delete({ where: { id } });
}
