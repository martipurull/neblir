import { Prisma } from "@prisma/client";
import { prisma } from "./client";

export async function createFeature(data: Prisma.FeatureUncheckedCreateInput) {
  return prisma.feature.create({ data });
}

export async function getAllFeatures() {
  return prisma.feature.findMany();
}

export async function getFeature(id: string) {
  return prisma.feature.findUnique({ where: { id } });
}

export async function getFeatures(ids: string[]) {
  return prisma.feature.findMany({ where: { id: { in: ids } } });
}

export async function getFeaturesAvailableForPathCharacter(
  pathId: string,
  pathCharacterRank: number
) {
  // First get the path to find its name (PathName enum)
  const path = await prisma.path.findUnique({
    where: { id: pathId },
    select: { name: true },
  });

  if (!path) {
    return [];
  }

  return prisma.feature.findMany({
    where: {
      applicablePaths: {
        has: path.name,
      },
      minPathRank: { lte: pathCharacterRank },
    },
  });
}

export async function deleteFeature(id: string) {
  return prisma.feature.delete({ where: { id } });
}
