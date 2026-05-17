import type { PathName, Prisma } from "@prisma/client";
import { prisma } from "./client";
import type {
  FeatureCatalogueCreate,
  FeatureCatalogueUpdate,
} from "@/app/lib/types/featureCatalogue";

export async function createFeature(data: Prisma.FeatureUncheckedCreateInput) {
  return prisma.feature.create({ data });
}

/**
 * Rebuilds `PathFeature` join rows so they match `Feature.applicablePaths`.
 * Resolves each `PathName` to a `Path` document by enum `name`.
 */
export async function syncPathFeatureLinks(
  featureId: string,
  applicablePaths: PathName[]
): Promise<void> {
  await prisma.pathFeature.deleteMany({ where: { featureId } });
  if (applicablePaths.length === 0) return;

  const paths = await prisma.path.findMany({
    where: { name: { in: applicablePaths } },
    select: { id: true, name: true },
  });
  const found = new Set(paths.map((p) => p.name));
  const missing = applicablePaths.filter((p) => !found.has(p));
  if (missing.length > 0) {
    throw new Error(
      `No Path rows for PathName(s): ${missing.join(", ")}. Create paths first.`
    );
  }

  await prisma.pathFeature.createMany({
    data: paths.map((p) => ({ pathId: p.id, featureId })),
  });
}

export async function createFeatureCatalogue(
  input: FeatureCatalogueCreate,
  options: { officialCatalogueWrite: boolean }
) {
  const duplicate = await prisma.feature.findFirst({
    where: { name: input.name.trim() },
    select: { id: true },
  });
  if (duplicate) {
    throw new Error(`A feature named "${input.name.trim()}" already exists.`);
  }

  const feature = await prisma.feature.create({
    data: {
      name: input.name.trim(),
      description: input.description.trim(),
      minPathRank: input.minPathRank,
      maxGrade: input.maxGrade,
      examples: input.examples,
      applicablePaths: input.applicablePaths,
      protectedFromOfficialImport: options.officialCatalogueWrite,
    },
  });

  await syncPathFeatureLinks(feature.id, input.applicablePaths);
  return feature;
}

export async function updateFeatureCatalogue(
  id: string,
  input: FeatureCatalogueUpdate,
  options: { officialCatalogueWrite: boolean }
) {
  const existing = await prisma.feature.findUnique({ where: { id } });
  if (!existing) return null;

  const nextName = input.name !== undefined ? input.name.trim() : existing.name;
  if (input.name !== undefined && nextName !== existing.name) {
    const duplicate = await prisma.feature.findFirst({
      where: { name: nextName, NOT: { id } },
      select: { id: true },
    });
    if (duplicate) {
      throw new Error(`A feature named "${nextName}" already exists.`);
    }
  }

  const nextApplicablePaths = input.applicablePaths ?? existing.applicablePaths;

  const data: Prisma.FeatureUpdateInput = {};
  if (input.name !== undefined) data.name = nextName;
  if (input.description !== undefined)
    data.description = input.description.trim();
  if (input.minPathRank !== undefined) data.minPathRank = input.minPathRank;
  if (input.maxGrade !== undefined) data.maxGrade = input.maxGrade;
  if (input.examples !== undefined) data.examples = input.examples;
  if (input.applicablePaths !== undefined)
    data.applicablePaths = { set: input.applicablePaths };

  if (options.officialCatalogueWrite) {
    data.protectedFromOfficialImport = true;
  }

  const feature = await prisma.feature.update({
    where: { id },
    data,
  });

  await syncPathFeatureLinks(id, nextApplicablePaths);
  return feature;
}

export async function deleteFeatureCatalogue(id: string) {
  await prisma.pathFeature.deleteMany({ where: { featureId: id } });
  await prisma.featureCharacter.deleteMany({ where: { featureId: id } });
  return prisma.feature.delete({ where: { id } });
}

export async function getAllFeatures() {
  return prisma.feature.findMany();
}

export async function getAllFeaturesAvailableForPath(pathName: PathName) {
  return prisma.feature.findMany({
    where: {
      applicablePaths: {
        has: pathName,
      },
    },
  });
}

export async function getAllFeaturesAvailableForPathAndRank(
  pathName: PathName,
  rank: number
) {
  return prisma.feature.findMany({
    where: {
      applicablePaths: {
        has: pathName,
      },
      minPathRank: { lte: rank },
    },
  });
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
