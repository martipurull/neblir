import type { Prisma } from "@prisma/client";
import { prisma } from "./client";

export async function getCharacterPaths(characterId: string) {
  return prisma.pathCharacter.findMany({
    where: { characterId },
    include: { path: true },
  });
}

export async function updatePathCharacter(
  id: string,
  data: Prisma.PathCharacterUpdateInput
) {
  return prisma.pathCharacter.update({ where: { id }, data });
}
