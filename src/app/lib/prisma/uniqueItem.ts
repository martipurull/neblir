import type { Prisma, UniqueItem } from "@prisma/client";
import type { UniqueItemCreate } from "@/app/lib/types/item";
import { prisma } from "./client";

export async function createUniqueItem(
  data: Prisma.UniqueItemUncheckedCreateInput
) {
  return prisma.uniqueItem.create({ data });
}

export async function getUniqueItem(id: string) {
  return prisma.uniqueItem.findUnique({ where: { id } });
}

/** Resolved item shape for inventory / API when there is no global/custom template. */
export function buildStandaloneResolvedItem(uniqueItem: UniqueItem) {
  const name =
    uniqueItem.nameOverride?.trim() !== ""
      ? (uniqueItem.nameOverride ?? "Unknown item")
      : "Unknown item";
  const weight = uniqueItem.weightOverride ?? 0;

  const equipSlotTypes =
    uniqueItem.equipSlotTypesOverride != null &&
    Array.isArray(uniqueItem.equipSlotTypesOverride)
      ? (uniqueItem.equipSlotTypesOverride as string[])
      : [];

  return {
    id: uniqueItem.id,
    type: "GENERAL_ITEM" as const,
    accessType: "PLAYER" as const,
    name,
    imageKey: uniqueItem.imageKeyOverride ?? null,
    confCost: uniqueItem.confCostOverride ?? 0,
    costInfo: uniqueItem.costInfoOverride ?? null,
    description: uniqueItem.descriptionOverride ?? "",
    notes: uniqueItem.notesOverride ?? null,
    weight,
    usage: uniqueItem.usageOverride ?? null,
    attackRoll:
      uniqueItem.attackRollOverride && uniqueItem.attackRollOverride.length > 0
        ? uniqueItem.attackRollOverride
        : [],
    attackMeleeBonus: uniqueItem.attackMeleeBonusOverride ?? null,
    attackRangeBonus: uniqueItem.attackRangeBonusOverride ?? null,
    attackThrowBonus: uniqueItem.attackThrowBonusOverride ?? null,
    defenceMeleeBonus: uniqueItem.defenceMeleeBonusOverride ?? null,
    defenceRangeBonus: uniqueItem.defenceRangeBonusOverride ?? null,
    gridAttackBonus: uniqueItem.gridAttackBonusOverride ?? null,
    gridDefenceBonus: uniqueItem.gridDefenceBonusOverride ?? null,
    effectiveRange: uniqueItem.effectiveRangeOverride ?? null,
    maxRange: uniqueItem.maxRangeOverride ?? null,
    damage: uniqueItem.damageOverride ?? null,
    equippable: uniqueItem.equippableOverride ?? false,
    equipSlotTypes,
    equipSlotCost: uniqueItem.equipSlotCostOverride ?? null,
    maxUses: uniqueItem.maxUsesOverride ?? null,
    specialTag: uniqueItem.specialTag,
    _resolvedFrom: "UNIQUE_ITEM" as const,
    _uniqueItemId: uniqueItem.id,
    ...(uniqueItem.gameId != null && { gameId: uniqueItem.gameId }),
  };
}

export function prismaDataFromUniqueItemCreate(
  ownerUserId: string,
  gameId: string | undefined,
  parsed: UniqueItemCreate
): Prisma.UniqueItemUncheckedCreateInput {
  const mutable: Omit<
    Prisma.UniqueItemUncheckedCreateInput,
    "ownerUserId" | "gameId" | "sourceType" | "itemId"
  > = {
    attackRollOverride: parsed.attackRollOverride ?? [],
    attackMeleeBonusOverride: parsed.attackMeleeBonusOverride ?? undefined,
    attackRangeBonusOverride: parsed.attackRangeBonusOverride ?? undefined,
    attackThrowBonusOverride: parsed.attackThrowBonusOverride ?? undefined,
    defenceMeleeBonusOverride: parsed.defenceMeleeBonusOverride ?? undefined,
    defenceRangeBonusOverride: parsed.defenceRangeBonusOverride ?? undefined,
    gridAttackBonusOverride: parsed.gridAttackBonusOverride ?? undefined,
    gridDefenceBonusOverride: parsed.gridDefenceBonusOverride ?? undefined,
    effectiveRangeOverride: parsed.effectiveRangeOverride ?? undefined,
    maxRangeOverride: parsed.maxRangeOverride ?? undefined,
    confCostOverride: parsed.confCostOverride ?? undefined,
    costInfoOverride: parsed.costInfoOverride ?? undefined,
    damageOverride: parsed.damageOverride ?? undefined,
    descriptionOverride: parsed.descriptionOverride ?? undefined,
    imageKeyOverride: parsed.imageKeyOverride ?? undefined,
    nameOverride: parsed.nameOverride ?? undefined,
    usageOverride: parsed.usageOverride ?? undefined,
    weightOverride: parsed.weightOverride ?? undefined,
    notesOverride: parsed.notesOverride ?? undefined,
    specialTag: parsed.specialTag ?? undefined,
    equippableOverride: parsed.equippableOverride ?? undefined,
    equipSlotTypesOverride: parsed.equipSlotTypesOverride ?? undefined,
    equipSlotCostOverride: parsed.equipSlotCostOverride ?? undefined,
    maxUsesOverride: parsed.maxUsesOverride ?? undefined,
  };

  if (parsed.sourceType === "STANDALONE") {
    return {
      ownerUserId,
      gameId,
      sourceType: "STANDALONE",
      ...mutable,
    };
  }

  return {
    ownerUserId,
    gameId,
    sourceType: parsed.sourceType,
    itemId: parsed.itemId,
    ...mutable,
  } satisfies Prisma.UniqueItemUncheckedCreateInput;
}

/** List unique items visible for a user in a game with display name. */
export async function getUniqueItemsByGameId(
  gameId: string,
  ownerUserId?: string
) {
  const items = await prisma.uniqueItem.findMany({
    where: ownerUserId
      ? {
          ownerUserId,
          OR: [{ gameId }, { gameId: null }],
        }
      : { game: { is: { id: gameId } } },
    select: {
      id: true,
      nameOverride: true,
      sourceType: true,
      itemId: true,
    },
    orderBy: { id: "asc" },
  });

  const withName = await Promise.all(
    items.map(async (u) => {
      const name =
        u.nameOverride != null && u.nameOverride !== ""
          ? u.nameOverride
          : u.sourceType === "STANDALONE"
            ? "Unnamed item"
            : u.sourceType === "GLOBAL_ITEM"
              ? ((
                  await prisma.item.findUnique({
                    where: { id: u.itemId! },
                    select: { name: true },
                  })
                )?.name ?? "Unknown")
              : ((
                  await prisma.customItem.findUnique({
                    where: { id: u.itemId! },
                    select: { name: true },
                  })
                )?.name ?? "Unknown");
      return { id: u.id, name };
    })
  );

  return withName;
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
  };
}

export async function getResolvedUniqueItem(id: string) {
  const uniqueItem = await getUniqueItem(id);
  if (!uniqueItem) {
    return null;
  }

  if (uniqueItem.sourceType === "STANDALONE") {
    return {
      ...uniqueItem,
      templateItem: null,
      resolvedItem: buildStandaloneResolvedItem(uniqueItem),
    };
  }

  if (!uniqueItem.itemId) {
    return {
      ...uniqueItem,
      templateItem: null,
      resolvedItem: null,
    };
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
