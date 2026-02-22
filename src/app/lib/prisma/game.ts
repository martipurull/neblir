import { Prisma } from "@prisma/client";
import { prisma } from "./client";

export function createGame(data: Prisma.GameCreateInput) {
  return prisma.game.create({ data });
}

export function getGame(id: string) {
  return prisma.game.findUnique({ where: { id } });
}

export function getUserGames(userId: string) {
  return prisma.game.findMany({
    where: { users: { some: { userId: userId } } },
  });
}

export function updateGame(id: string, data: Prisma.GameUpdateInput) {
  return prisma.game.update({ where: { id }, data });
}

export function deleteGame(id: string) {
  return prisma.$transaction([
    prisma.gameUser.deleteMany({ where: { gameId: id } }),
    prisma.gameCharacter.deleteMany({ where: { gameId: id } }),
    prisma.customItem.deleteMany({ where: { gameId: id } }),
    prisma.game.delete({ where: { id } }),
  ]);
}

export async function userIsInGame(gameId: string, userId: string): Promise<boolean> {
  const gu = await prisma.gameUser.findFirst({
    where: { gameId, userId },
  });
  return !!gu;
}
