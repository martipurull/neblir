import { prisma } from "./client";

export function getGameImages(gameId: string) {
  return prisma.gameImage.findMany({
    where: { gameId },
    orderBy: { createdAt: "desc" },
  });
}

export function getGameImageById(id: string) {
  return prisma.gameImage.findUnique({ where: { id } });
}

export function createGameImage(data: {
  gameId: string;
  title: string;
  description?: string | null;
  imageKey: string;
  uploadedByUserId: string;
}) {
  return prisma.gameImage.create({ data });
}

export function deleteGameImage(id: string) {
  return prisma.gameImage.delete({ where: { id } });
}
