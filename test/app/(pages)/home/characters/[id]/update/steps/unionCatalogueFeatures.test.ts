import { PathName } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  unionCatalogueFeatures,
  type UnionCatalogueFeature,
} from "@/app/(pages)/home/characters/[id]/update/steps/unionCatalogueFeatures";
import type {
  CharacterUpdateFeatureEntry,
  CharacterUpdatePathEntry,
} from "@/app/(pages)/home/characters/[id]/update/schemas";

const soldierRank2: CharacterUpdatePathEntry = {
  pathId: "path-soldier",
  rank: 2,
  name: PathName.SOLDIER,
};

const nerdHeroRank1: CharacterUpdatePathEntry = {
  pathId: "path-nerd",
  rank: 1,
  name: PathName.NERD_HERO,
};

const coveringFire: CharacterUpdateFeatureEntry = {
  featureId: "feat-covering-fire",
  grade: 2,
  name: "Covering Fire",
  maxGrade: 3,
  minPathRank: 2,
  applicablePaths: [PathName.SOLDIER],
};

const coveringFireCatalogue: UnionCatalogueFeature = {
  id: "feat-covering-fire",
  name: "Covering Fire",
  maxGrade: 3,
  minPathRank: 2,
  description: "<p>Suppress a lane.</p>",
  applicablePaths: [PathName.SOLDIER],
};

const fieldSurgeryCatalogue: UnionCatalogueFeature = {
  id: "feat-field-surgery",
  name: "Field Surgery",
  maxGrade: 2,
  minPathRank: 1,
  description: null,
  applicablePaths: [PathName.SCIENTIST_DOCTOR],
};

describe("unionCatalogueFeatures", () => {
  it("keeps a legal owned feature in the catalogue when the union fetch has not returned it", () => {
    const visible = unionCatalogueFeatures({
      catalogue: [],
      ownedFeatures: [coveringFire],
      ownedPaths: [soldierRank2],
    });

    expect(visible).toEqual([
      {
        id: "feat-covering-fire",
        name: "Covering Fire",
        maxGrade: 3,
        minPathRank: 2,
        description: null,
        applicablePaths: [PathName.SOLDIER],
      },
    ]);
  });

  it("leaves illegal owned features out of the catalogue list", () => {
    const visible = unionCatalogueFeatures({
      catalogue: [fieldSurgeryCatalogue],
      ownedFeatures: [coveringFire],
      ownedPaths: [nerdHeroRank1],
    });

    expect(visible).toEqual([fieldSurgeryCatalogue]);
  });

  it("does not duplicate a legal owned feature already in the union catalogue", () => {
    const visible = unionCatalogueFeatures({
      catalogue: [coveringFireCatalogue],
      ownedFeatures: [coveringFire],
      ownedPaths: [soldierRank2],
    });

    expect(visible).toEqual([coveringFireCatalogue]);
  });

  it("includes union catalogue features that are not owned", () => {
    const visible = unionCatalogueFeatures({
      catalogue: [fieldSurgeryCatalogue, coveringFireCatalogue],
      ownedFeatures: [coveringFire],
      ownedPaths: [soldierRank2],
    });

    expect(visible).toEqual([coveringFireCatalogue, fieldSurgeryCatalogue]);
  });

  it("orders the folded owned feature among catalogue names", () => {
    const visible = unionCatalogueFeatures({
      catalogue: [fieldSurgeryCatalogue],
      ownedFeatures: [coveringFire],
      ownedPaths: [soldierRank2],
    });

    expect(visible.map((feature) => feature.name)).toEqual([
      "Covering Fire",
      "Field Surgery",
    ]);
  });
});
