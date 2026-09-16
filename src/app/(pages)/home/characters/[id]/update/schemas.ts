import type { CharacterDetail } from "@/app/lib/types/character";
import type { CharacterEditableUpdateRequest } from "@/app/api/characters/schemas";
import type { PathName } from "@prisma/client";

export type CharacterUpdatePathEntry = {
  pathId: string;
  rank: number;
  name?: PathName;
};

export type CharacterUpdateFeatureEntry = {
  featureId: string;
  grade: number;
  name?: string;
  maxGrade?: number;
  minPathRank?: number;
  applicablePaths?: PathName[];
};

export type CharacterUpdateFormValues = Omit<
  CharacterEditableUpdateRequest,
  "paths" | "initialFeatures"
> & {
  paths: CharacterUpdatePathEntry[];
  initialFeatures?: CharacterUpdateFeatureEntry[];
};

export function getUnallocatedLevel(
  level: number,
  paths: Array<{ rank: number }>
): number {
  const rankSum = paths.reduce((sum, path) => sum + path.rank, 0);
  return level - rankSum;
}

export function getFeatureGradeSlots(level: number): number {
  return Math.max(0, 2 * (level - 1));
}

export function isOwnedFeatureLegal(
  feature: { applicablePaths?: PathName[]; minPathRank?: number },
  paths: Array<{ name?: PathName; rank: number }>
): boolean {
  const applicablePaths = feature.applicablePaths;
  const minPathRank = feature.minPathRank;
  if (applicablePaths == null || minPathRank == null) {
    return true;
  }
  return paths.some(
    (path) =>
      path.name != null &&
      applicablePaths.includes(path.name) &&
      path.rank >= minPathRank
  );
}

export function toCharacterUpdateRequest(
  values: CharacterUpdateFormValues
): CharacterEditableUpdateRequest {
  return {
    ...values,
    paths: values.paths.map((path) => ({
      pathId: path.pathId,
      rank: path.rank,
    })),
    initialFeatures: (values.initialFeatures ?? []).map((feature) => ({
      featureId: feature.featureId,
      grade: feature.grade,
    })),
  };
}

export function toCharacterUpdateFormValues(
  character: CharacterDetail
): CharacterUpdateFormValues {
  const {
    specialAbility: _persistedSpecialAbility,
    ...generalWithoutStoredAbility
  } = character.generalInformation;

  return {
    generalInformation: {
      ...generalWithoutStoredAbility,
      specialAbilityName: _persistedSpecialAbility?.name,
      backstory: character.generalInformation.backstory ?? "",
      summary: character.generalInformation.summary ?? "",
      avatarKey: character.generalInformation.avatarKey ?? "",
    },
    health: {
      rolledPhysicalHealth: character.health.rolledPhysicalHealth,
      rolledMentalHealth: character.health.rolledMentalHealth,
      seriousPhysicalInjuries: character.health.seriousPhysicalInjuries,
      seriousTrauma: character.health.seriousTrauma,
      status: character.health.status,
    },
    combatInformation: {
      armourMod: character.combatInformation.armourMod,
      armourMaxHP: character.combatInformation.armourMaxHP,
      armourCurrentHP: character.combatInformation.armourCurrentHP,
      throwAttackMod: character.combatInformation.throwAttackMod,
    },
    innateAttributes: character.innateAttributes,
    learnedSkills: {
      generalSkills: character.learnedSkills.generalSkills,
      specialSkills: [
        character.learnedSkills.specialSkills?.[0] ?? "",
        character.learnedSkills.specialSkills?.[1] ?? "",
        character.learnedSkills.specialSkills?.[2] ?? "",
      ],
    },
    wallet: character.wallet ?? [],
    paths: (character.paths ?? []).map((path) => ({
      pathId: path.id,
      rank: path.rank ?? 1,
      name: path.name,
    })),
    initialFeatures: (character.features ?? []).map((feature) => ({
      featureId: feature.featureId,
      grade: feature.grade,
      name: feature.feature.name,
      maxGrade: feature.feature.maxGrade,
      minPathRank: feature.feature.minPathRank,
      applicablePaths: feature.feature.applicablePaths,
    })),
  };
}
