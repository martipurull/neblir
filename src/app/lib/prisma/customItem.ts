import { Prisma } from "@prisma/client";
import { prisma } from "./client";

export async function createCustomItem(
  data: Prisma.CustomItemUncheckedCreateInput
) {
  return prisma.customItem.create({ data });
}

export async function getCustomItem(id: string) {
  return prisma.customItem.findUnique({ where: { id } });
}

export async function getCustomItemsByGame(gameId: string) {
  return prisma.customItem.findMany({
    where: { gameId },
  });
}

export async function updateCustomItem(
  id: string,
  data: Prisma.CustomItemUpdateInput
) {
  return prisma.customItem.update({ where: { id }, data });
}

export async function deleteCustomItem(id: string) {
  return prisma.customItem.delete({ where: { id } });
}
