import { Prisma } from "@prisma/client";
import { prisma } from "./client";

export async function createGameUser(
  data: Prisma.GameUserUncheckedCreateInput
) {
  return prisma.gameUser.create({ data });
}
export async function deleteGameUser(id: string) {
  return prisma.gameUser.delete({ where: { id } });
}
