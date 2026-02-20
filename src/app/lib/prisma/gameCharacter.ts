import { Prisma } from "@prisma/client";
import { prisma } from "./client";

export async function createGameCharacter(
  data: Prisma.GameCharacterUncheckedCreateInput
) {
  return prisma.gameCharacter.create({ data });
}

export async function getCharacterGames(characterId: string) {
  return prisma.gameCharacter.findMany({ where: { characterId } });
}

export async function deleteGameCharacter(id: string) {
  return prisma.gameCharacter.delete({ where: { id } });
}
