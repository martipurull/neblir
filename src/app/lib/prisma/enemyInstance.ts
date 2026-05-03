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

export function updateEnemyInstance(
  id: string,
  data: Prisma.EnemyInstanceUpdateInput
) {
  return prisma.enemyInstance.update({ where: { id }, data });
}

export function deleteEnemyInstance(id: string) {
  return prisma.enemyInstance.delete({ where: { id } });
}
