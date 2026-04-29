import { prisma } from "./client";

export function getGameRecaps(gameId: string) {
  return prisma.gameRecap.findMany({
    where: { gameId },
    orderBy: { createdAt: "desc" },
  });
}

export function getGameRecapById(id: string) {
  return prisma.gameRecap.findUnique({
    where: { id },
  });
}

export function createGameRecap(data: {
  gameId: string;
  title: string;
  summary?: string | null;
  fileKey: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedByUserId: string;
}) {
  return prisma.gameRecap.create({ data });
}

export function deleteGameRecap(id: string) {
  return prisma.gameRecap.delete({ where: { id } });
}
