import type { Prisma } from "@prisma/client";
import { prisma } from "./client";

export function createGame(data: Prisma.GameCreateInput) {
  return prisma.game.create({ data });
}

export function getGame(id: string) {
  return prisma.game.findUnique({ where: { id } });
}

export function getGameWithDetails(id: string) {
  return prisma.game.findUnique({
    where: { id },
    include: {
      users: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
      characters: {
        include: {
          character: {
            select: {
              id: true,
              generalInformation: true,
              combatInformation: true,
              users: { select: { userId: true } },
            },
          },
        },
      },
      customItems: {
        select: {
          id: true,
          name: true,
          type: true,
          description: true,
          imageKey: true,
        },
        orderBy: { name: "asc" },
      },
      discordIntegration: true,
    },
  });
}

export function getUserGames(userId: string) {
  return prisma.game.findMany({
    where: { users: { some: { userId: userId } } },
    include: {
      users: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export function updateGame(id: string, data: Prisma.GameUpdateInput) {
  return prisma.game.update({ where: { id }, data });
}

export function deleteGame(id: string) {
  return prisma.$transaction([
    prisma.gameInvite.deleteMany({ where: { gameId: id } }),
    prisma.gameUser.deleteMany({ where: { gameId: id } }),
    prisma.gameCharacter.deleteMany({ where: { gameId: id } }),
    prisma.customItem.deleteMany({ where: { gameId: id } }),
    prisma.rollEvent.deleteMany({ where: { gameId: id } }),
    prisma.discordIntegration.deleteMany({ where: { gameId: id } }),
    prisma.game.delete({ where: { id } }),
  ]);
}

export async function userIsInGame(
  gameId: string,
  userId: string
): Promise<boolean> {
  const gu = await prisma.gameUser.findFirst({
    where: { gameId, userId },
  });
  return !!gu;
}

export async function hasPendingInvite(
  gameId: string,
  userId: string
): Promise<boolean> {
  const inv = await prisma.gameInvite.findUnique({
    where: {
      gameId_invitedUserId: { gameId, invitedUserId: userId },
    },
  });
  return !!inv;
}

export function createGameInvites(
  gameId: string,
  invitedByUserId: string,
  invitedUserIds: string[]
) {
  return prisma.gameInvite.createMany({
    data: invitedUserIds.map((invitedUserId) => ({
      gameId,
      invitedByUserId,
      invitedUserId,
    })),
  });
}

export function getGameInvitesForUser(userId: string) {
  return prisma.gameInvite.findMany({
    where: { invitedUserId: userId },
    include: {
      game: { select: { id: true, name: true } },
      invitedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Pending invites sent for a game (for GM view). */
export function getPendingInvitesForGame(gameId: string) {
  return prisma.gameInvite.findMany({
    where: { gameId },
    include: {
      invitedUser: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function acceptGameInvite(
  gameId: string,
  userId: string
): Promise<boolean> {
  const invite = await prisma.gameInvite.findUnique({
    where: {
      gameId_invitedUserId: { gameId, invitedUserId: userId },
    },
  });
  if (!invite) return false;
  await prisma.$transaction([
    prisma.gameUser.create({
      data: { gameId, userId },
    }),
    prisma.gameInvite.delete({
      where: {
        gameId_invitedUserId: { gameId, invitedUserId: userId },
      },
    }),
  ]);
  return true;
}

export async function declineGameInvite(
  gameId: string,
  userId: string
): Promise<boolean> {
  const invite = await prisma.gameInvite.findUnique({
    where: {
      gameId_invitedUserId: { gameId, invitedUserId: userId },
    },
  });
  if (!invite) return false;
  await prisma.gameInvite.delete({
    where: {
      gameId_invitedUserId: { gameId, invitedUserId: userId },
    },
  });
  return true;
}
