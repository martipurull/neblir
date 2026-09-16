import type { PathName } from "@prisma/client";
import {
  isOwnedFeatureLegal,
  type CharacterUpdateFeatureEntry,
  type CharacterUpdatePathEntry,
} from "../schemas";

export type UnionCatalogueFeature = {
  id: string;
  name: string;
  maxGrade: number;
  minPathRank: number;
  description?: string | null;
  applicablePaths: PathName[];
};

export function unionCatalogueFeatures({
  catalogue,
  ownedFeatures,
  ownedPaths,
}: {
  catalogue: UnionCatalogueFeature[];
  ownedFeatures: CharacterUpdateFeatureEntry[];
  ownedPaths: CharacterUpdatePathEntry[];
}): UnionCatalogueFeature[] {
  const byId = new Map(catalogue.map((feature) => [feature.id, feature]));
  for (const owned of ownedFeatures) {
    if (byId.has(owned.featureId)) continue;
    if (!isOwnedFeatureLegal(owned, ownedPaths)) continue;
    byId.set(owned.featureId, {
      id: owned.featureId,
      name: owned.name ?? owned.featureId,
      maxGrade: owned.maxGrade ?? 1,
      minPathRank: owned.minPathRank ?? 1,
      description: null,
      applicablePaths: owned.applicablePaths ?? [],
    });
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}
