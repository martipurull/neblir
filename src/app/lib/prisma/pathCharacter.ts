import { Prisma } from "@prisma/client";
import { prisma } from "./client";

export async function createPathCharacter(
  data: Prisma.PathCharacterUncheckedCreateInput
) {
  return prisma.pathCharacter.create({ data });
}

export async function getCharacterPaths(characterId: string) {
  return prisma.pathCharacter.findMany({ where: { characterId } });
}

export async function getPathCharacter(id: string) {
  return prisma.pathCharacter.findUnique({ where: { id } });
}

export async function updatePathCharacter(
  id: string,
  data: Prisma.PathCharacterUpdateInput
) {
  return prisma.pathCharacter.update({ where: { id }, data });
}

export async function deletePathCharacter(id: string) {
  return prisma.pathCharacter.delete({ where: { id } });
}
