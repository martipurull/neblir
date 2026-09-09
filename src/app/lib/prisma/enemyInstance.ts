import type { Prisma } from "@prisma/client";
import { prisma } from "./client";

export function createEnemyInstance(
  data: Prisma.EnemyInstanceUncheckedCreateInput
) {
  return prisma.enemyInstance.create({ data });
}

export function getEnemyInstancesByGame(gameId: string) {
  return prisma.enemyInstance.findMany({
    where: { gameId },
    orderBy: { createdAt: "asc" },
  });
}

export function getEnemyInstance(id: string) {
  return prisma.enemyInstance.findUnique({ where: { id } });
}

/** Whether an instance is visible to players (`isPublic !== false`). */
export async function getEnemyInstanceIsPublic(
  gameId: string,
  instanceId: string
): Promise<boolean | null> {
  const row = await prisma.enemyInstance.findFirst({
    where: { id: instanceId, gameId },
    select: { isPublic: true },
  });
  if (!row) return null;
  return row.isPublic !== false;
}

export function updateEnemyInstance(
  id: string,
  data: Prisma.EnemyInstanceUpdateInput
) {
  return prisma.enemyInstance.update({ where: { id }, data });
}

export type DeleteEnemyInstancesForGameResult =
  | { deleted: true }
  | { deleted: false; reason: "not_found" };

/**
 * Deletes a set of enemy instances in a game all-or-nothing and removes matching
 * ENEMY initiative entries. Does not modify roll events.
 */
export async function deleteEnemyInstancesForGame(
  gameId: string,
  instanceIds: string[]
): Promise<DeleteEnemyInstancesForGameResult> {
  const uniqueIds = [...new Set(instanceIds)];
  if (uniqueIds.length === 0) {
    return { deleted: false, reason: "not_found" };
  }

  return prisma.$transaction(async (tx) => {
    const found = await tx.enemyInstance.findMany({
      where: { gameId, id: { in: uniqueIds } },
      select: { id: true },
    });
    if (found.length !== uniqueIds.length) {
      return { deleted: false, reason: "not_found" };
    }

    const removedIds = new Set(uniqueIds);
    const game = await tx.game.findUnique({
      where: { id: gameId },
      select: { initiativeOrder: true },
    });
    const currentInitiativeOrder = game?.initiativeOrder ?? [];
    const nextInitiativeOrder = currentInitiativeOrder.filter(
      (entry) =>
        !(entry.combatantType === "ENEMY" && removedIds.has(entry.combatantId))
    );

    if (nextInitiativeOrder.length !== currentInitiativeOrder.length) {
      await tx.game.update({
        where: { id: gameId },
        data: { initiativeOrder: nextInitiativeOrder },
      });
    }

    await tx.enemyInstance.deleteMany({
      where: { gameId, id: { in: uniqueIds } },
    });

    return { deleted: true };
  });
}
