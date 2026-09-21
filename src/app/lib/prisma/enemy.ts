import type { Prisma } from "@prisma/client";
import { prisma } from "./client";

export function createEnemy(data: Prisma.EnemyCreateInput) {
  return prisma.enemy.create({ data });
}

export function getEnemy(id: string) {
  return prisma.enemy.findUnique({ where: { id } });
}

export function getEnemies() {
  return prisma.enemy.findMany({
    orderBy: { name: "asc" },
  });
}

export function updateEnemy(id: string, data: Prisma.EnemyUpdateInput) {
  return prisma.enemy.update({ where: { id }, data });
}

export function deleteOfficialEnemy(id: string) {
  return prisma.$transaction(async (tx) => {
    const spawnedInstances = await tx.enemyInstance.findMany({
      where: { sourceOfficialEnemyId: id },
      select: { id: true, gameId: true },
    });
    const spawnedInstanceIds = new Set(spawnedInstances.map((row) => row.id));

    if (spawnedInstanceIds.size > 0) {
      const gameIds = [...new Set(spawnedInstances.map((row) => row.gameId))];
      for (const gameId of gameIds) {
        const game = await tx.game.findUnique({
          where: { id: gameId },
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
            where: { id: gameId },
            data: { initiativeOrder: nextInitiativeOrder },
          });
        }
      }

      await tx.enemyInstance.deleteMany({
        where: { sourceOfficialEnemyId: id },
      });
    }

    return tx.enemy.delete({ where: { id } });
  });
}
