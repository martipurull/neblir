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
  return prisma.customEnemy.delete({ where: { id } });
}
