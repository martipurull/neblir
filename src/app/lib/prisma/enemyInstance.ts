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

export function deleteEnemyInstance(id: string) {
  return prisma.enemyInstance.delete({ where: { id } });
}
