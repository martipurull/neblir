import type { Prisma } from "@prisma/client";
import { prisma } from "./client";

export function createCustomEnemy(
  data: Prisma.CustomEnemyUncheckedCreateInput
) {
  return prisma.customEnemy.create({ data });
}

export function getCustomEnemy(id: string) {
  return prisma.customEnemy.findUnique({ where: { id } });
}

export function getCustomEnemiesByGame(gameId: string) {
  return prisma.customEnemy.findMany({
    where: { gameId },
    orderBy: { name: "asc" },
  });
}

export function updateCustomEnemy(
  id: string,
  data: Prisma.CustomEnemyUpdateInput
) {
  return prisma.customEnemy.update({ where: { id }, data });
}

export function deleteCustomEnemy(id: string) {
  return prisma.$transaction(async (tx) => {
    const customEnemy = await tx.customEnemy.findUnique({
      where: { id },
      select: { gameId: true },
    });

    if (!customEnemy) {
      return tx.customEnemy.delete({ where: { id } });
    }

    const spawnedInstances = await tx.enemyInstance.findMany({
      where: { sourceCustomEnemyId: id },
      select: { id: true },
    });
    const spawnedInstanceIds = new Set(spawnedInstances.map((row) => row.id));

    if (spawnedInstanceIds.size > 0) {
      const game = await tx.game.findUnique({
        where: { id: customEnemy.gameId },
        select: { initiativeOrder: true },
      });
      const currentInitiativeOrder = game?.initiativeOrder ?? [];
      const nextInitiativeOrder = currentInitiativeOrder.filter(
        (entry) =>
          !(
            entry.combatantType === "ENEMY" &&
            spawnedInstanceIds.has(entry.combatantId)
          )
      );

      if (nextInitiativeOrder.length !== currentInitiativeOrder.length) {
        await tx.game.update({
          where: { id: customEnemy.gameId },
          data: { initiativeOrder: nextInitiativeOrder },
        });
      }
    }

    await tx.enemyInstance.deleteMany({
      where: { sourceCustomEnemyId: id },
    });

    return tx.customEnemy.delete({ where: { id } });
  });
}
