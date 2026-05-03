import type { Prisma } from "@prisma/client";
import { prisma } from "./client";

export function createEnemy(data: Prisma.EnemyCreateInput) {
  return prisma.enemy.create({ data });
}

export function upsertEnemyByName(
  name: string,
  create: Prisma.EnemyCreateInput,
  update: Prisma.EnemyUpdateInput
) {
  return prisma.enemy.upsert({
    where: { name },
    create,
    update,
  });
}

export function getEnemy(id: string) {
  return prisma.enemy.findUnique({ where: { id } });
}

export function getEnemies() {
  return prisma.enemy.findMany({
    orderBy: { name: "asc" },
  });
}
