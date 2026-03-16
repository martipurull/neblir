import type { Prisma } from "@prisma/client";
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

export async function characterIsInGame(
  gameId: string,
  characterId: string
): Promise<boolean> {
  const gc = await prisma.gameCharacter.findFirst({
    where: { gameId, characterId },
  });
  return !!gc;
}
