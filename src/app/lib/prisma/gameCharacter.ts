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

/** True when both characters are registered in at least one shared game. */
export async function charactersShareAnyGame(
  characterIdA: string,
  characterIdB: string
): Promise<boolean> {
  const rows = await prisma.gameCharacter.findMany({
    where: { characterId: characterIdA },
    select: { gameId: true },
  });
  if (rows.length === 0) return false;
  const shared = await prisma.gameCharacter.findFirst({
    where: {
      characterId: characterIdB,
      gameId: { in: rows.map((r) => r.gameId) },
    },
  });
  return !!shared;
}
