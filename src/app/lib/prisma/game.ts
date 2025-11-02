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
  return prisma.game.delete({ where: { id } });
}
