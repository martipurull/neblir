import { prisma } from "./client";
import { Prisma } from "@prisma/client";

export async function createUser(data: Prisma.UserCreateInput) {
  return prisma.user.create({ data });
}

export async function getUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { characters: true, games: true },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function updateUser(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({ where: { id }, data });
}

export async function deleteUser(id: string) {
  return prisma.$transaction(async (tx) => {
    const ownedGames = await tx.game.findMany({
      where: { gameMaster: id },
      select: { id: true },
    });
    const ownedGameIds = ownedGames.map((game) => game.id);

    if (ownedGameIds.length > 0) {
      await tx.gameUser.deleteMany({
        where: { gameId: { in: ownedGameIds } },
      });
      await tx.gameCharacter.deleteMany({
        where: { gameId: { in: ownedGameIds } },
      });
      await tx.customItem.deleteMany({
        where: { gameId: { in: ownedGameIds } },
      });
      await tx.game.deleteMany({
        where: { id: { in: ownedGameIds } },
      });
    }

    await tx.gameUser.deleteMany({ where: { userId: id } });
    await tx.characterUser.deleteMany({ where: { userId: id } });

    return tx.user.delete({ where: { id } });
  });
}
