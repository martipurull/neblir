import { prisma } from "./client";
import type { GameFileKind } from "@prisma/client";

export function getGameFiles(gameId: string) {
  return prisma.gameFile.findMany({
    where: { gameId },
    orderBy: { createdAt: "desc" },
  });
}

export function getGameFileById(id: string) {
  return prisma.gameFile.findUnique({ where: { id } });
}

export function createGameFile(data: {
  gameId: string;
  title: string;
  description?: string | null;
  kind: GameFileKind;
  fileKey: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedByUserId: string;
}) {
  return prisma.gameFile.create({ data });
}

export function deleteGameFile(id: string) {
  return prisma.gameFile.delete({ where: { id } });
}
