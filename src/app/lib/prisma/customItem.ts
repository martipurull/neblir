import type { Prisma } from "@prisma/client";
import { mapPrismaCustomItemToApi } from "@/app/lib/itemModifierPrisma";
import { prisma } from "./client";

export async function createCustomItem(
  data: Prisma.CustomItemUncheckedCreateInput
) {
  const row = await prisma.customItem.create({ data });
  return mapPrismaCustomItemToApi(row);
}

export async function getCustomItem(id: string) {
  const row = await prisma.customItem.findUnique({ where: { id } });
  return row ? mapPrismaCustomItemToApi(row) : null;
}

export async function getCustomItemsByGame(gameId: string) {
  const rows = await prisma.customItem.findMany({
    where: { gameId },
  });
  return rows.map(mapPrismaCustomItemToApi);
}

export async function updateCustomItem(
  id: string,
  data: Prisma.CustomItemUpdateInput
) {
  const row = await prisma.customItem.update({ where: { id }, data });
  return mapPrismaCustomItemToApi(row);
}

export async function deleteCustomItem(id: string) {
  return prisma.customItem.delete({ where: { id } });
}
