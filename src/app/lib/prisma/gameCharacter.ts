import { Prisma } from "@prisma/client";
import { prisma } from "./client";

export async function createGameCharacter(
  data: Prisma.GameCharacterUncheckedCreateInput
) {
  return prisma.gameCharacter.create({ data });
}
export async function deleteGameCharacter(id: string) {
  return prisma.gameCharacter.delete({ where: { id } });
}
