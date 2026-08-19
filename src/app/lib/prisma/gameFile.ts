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
  access: "PLAYER" | "GAME_MASTER";
  fileKey: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedByUserId: string;
}) {
  return prisma.gameFile.create({ data });
}

export function updateGameFile(
  id: string,
  data: {
    title: string;
    description?: string | null;
    access: "PLAYER" | "GAME_MASTER";
    kind?: GameFileKind;
    fileKey?: string;
    fileName?: string;
    fileSizeBytes?: number;
  }
) {
  return prisma.gameFile.update({ where: { id }, data });
}

export function deleteGameFile(id: string) {
  return prisma.gameFile.delete({ where: { id } });
}
