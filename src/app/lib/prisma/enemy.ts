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
