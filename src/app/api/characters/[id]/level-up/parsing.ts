import { z } from "zod";
import type { LevelUpRequest } from "./schema";
import { levelUpCharacterBodySchema } from "./schema";
import { getFeatures } from "@/app/lib/prisma/feature";
import {
  getCharacterFeatures,
  getFeatureCharacterByFeatureId,
} from "@/app/lib/prisma/featureCharacter";
import { getCharacterPaths } from "@/app/lib/prisma/pathCharacter";
import { getPath } from "@/app/lib/prisma/path";
import {
  type Character,
  combatInformationSchema,
} from "@/app/lib/types/character";

/**
 * Character shape used by level-up parsing. Only the fields actually read are required,
 * so we can pass either a full Character or the getCharacter() result (which has
 * inventory/paths/features as Prisma relation shapes instead of schema types).
 */
export type CharacterForLevelUp = Pick<
  Character,
  | "generalInformation"
  | "health"
  | "combatInformation"
  | "innateAttributes"
  | "learnedSkills"
>;

// Check if any of the features, incremental or new, have a minPathGrade above the character's current path rank
export async function areFeaturesValidForLevelUp(
  characterId: string,
  selectedPathId: string,
  featureIds?: string[]
) {
  if (!featureIds?.length) {
    return true;
  }
  const existingFeatures = await getFeatures(featureIds);
  const characterPaths = await getCharacterPaths(characterId);
  const selectedPath = characterPaths.find(
    (path) => path.path.id === selectedPathId
  );
  const effectivePathRanks = new Map<string, number>();

  for (const path of characterPaths) {
    effectivePathRanks.set(path.path.name, path.rank + 1);
  }
  if (!selectedPath) {
    // New path selected on level-up starts at rank 1.
    const selectedPathEntity = await getPath(selectedPathId);
    if (!selectedPathEntity) return false;
    effectivePathRanks.set(selectedPathEntity.name, 1);
  }
  const featureValidationChecks = [];
  for (const feature of existingFeatures) {
    featureValidationChecks.push(
      feature.applicablePaths.some((pathName) => {
        const rank = effectivePathRanks.get(pathName);
        return typeof rank === "number" && rank >= feature.minPathRank;
      })
    );
  }
  return featureValidationChecks.every((check) => check);
}

export async function areIncrementFeaturesValid(
  characterId: string,
  featureIds?: string[]
) {
  if (!featureIds?.length) {
    return false;
  }
  const groupedCounts = featureIds.reduce((acc, featureId) => {
    acc.set(featureId, (acc.get(featureId) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());
  const existingFeatures = await getFeatures([...groupedCounts.keys()]);
  const incrementFeatureChecks = await Promise.all(
    existingFeatures.map(async (feature) => {
      const requestedIncrements = groupedCounts.get(feature.id) ?? 0;
      if (requestedIncrements <= 0) return false;
      const featureCharacter = await getFeatureCharacterByFeatureId(
        feature.id,
        characterId
      );
      return (
        featureCharacter &&
        featureCharacter.grade + requestedIncrements <= feature.maxGrade
      );
    })
  );

  return (
    incrementFeatureChecks.every((valid) => valid) &&
    existingFeatures.length === groupedCounts.size
  );
}

export function parseAttributeChanges(
  attributeChanges: LevelUpRequest["attributeChanges"]
) {
  if (!attributeChanges?.length) {
    return undefined;
  }
  return attributeChanges.map((change) => {
    const fromParts = change.from.split(".");
    const toParts = change.to.split(".");

    return {
      from: {
        attribute: fromParts[0],
        property: fromParts[1],
      },
      to: {
        attribute: toParts[0],
        property: toParts[1],
      },
    };
  });
}

function cloneInnateAttributes(
  innate: CharacterForLevelUp["innateAttributes"]
): CharacterForLevelUp["innateAttributes"] {
  return {
    intelligence: { ...innate.intelligence },
    wisdom: { ...innate.wisdom },
    personality: { ...innate.personality },
    strength: { ...innate.strength },
    dexterity: { ...innate.dexterity },
    constitution: { ...innate.constitution },
  };
}

function attributeSwapBoundsError(message: string) {
  return new z.ZodError([
    {
      code: z.ZodIssueCode.custom,
      path: ["attributeChanges"],
      message,
    },
  ]);
}

/**
 * Applies level-up attribute swaps on nested innate attributes.
 * Enforces game bounds: no stat may go below 1 or above 5.
 */
export function applyLevelUpAttributeSwaps(
  innateAttributes: CharacterForLevelUp["innateAttributes"],
  changes: NonNullable<ReturnType<typeof parseAttributeChanges>>
):
  | { ok: true; innateAttributes: CharacterForLevelUp["innateAttributes"] }
  | { ok: false; error: z.ZodError } {
  const next = cloneInnateAttributes(innateAttributes);
  const byGroup = next as unknown as Record<string, Record<string, number>>;

  for (const change of changes) {
    if (
      change.from.attribute === change.to.attribute &&
      change.from.property === change.to.property
    ) {
      return {
        ok: false,
        error: attributeSwapBoundsError(
          "From and to attribute must be different."
        ),
      };
    }

    const fromGroupKey = change.from.attribute;
    const toGroupKey = change.to.attribute;

    const fromGroup = byGroup[fromGroupKey];
    const toGroup = byGroup[toGroupKey];
    const fromCurrent = fromGroup[change.from.property];
    const toCurrent = toGroup[change.to.property];

    if (typeof fromCurrent !== "number" || typeof toCurrent !== "number") {
      return {
        ok: false,
        error: attributeSwapBoundsError(
          "Invalid innate attribute data for this swap."
        ),
      };
    }

    if (fromCurrent < 2) {
      return {
        ok: false,
        error: attributeSwapBoundsError(
          "Cannot decrease an attribute below 1 (source is already at minimum)."
        ),
      };
    }
    if (toCurrent > 4) {
      return {
        ok: false,
        error: attributeSwapBoundsError(
          "Cannot increase an attribute above 5 (target is already at maximum)."
        ),
      };
    }

    if (fromGroupKey === toGroupKey) {
      byGroup[fromGroupKey] = {
        ...fromGroup,
        [change.from.property]: fromCurrent - 1,
        [change.to.property]: toCurrent + 1,
      };
    } else {
      byGroup[fromGroupKey] = {
        ...fromGroup,
        [change.from.property]: fromCurrent - 1,
      };
      byGroup[toGroupKey] = {
        ...toGroup,
        [change.to.property]: toCurrent + 1,
      };
    }
  }

  return { ok: true, innateAttributes: next };
}

export function parseHealthUpdate(
  healthUpdate: LevelUpRequest["healthUpdate"],
  existingCharacter: CharacterForLevelUp
) {
  const newCurrentPhysicalHealth = Math.min(
    existingCharacter.health.currentPhysicalHealth +
      healthUpdate.rolledPhysicalHealth,
    existingCharacter.health.maxPhysicalHealth +
      healthUpdate.rolledPhysicalHealth
  );
  const newRolledPhysicalHealth =
    existingCharacter.health.rolledPhysicalHealth +
    healthUpdate.rolledPhysicalHealth;
  const newMaxPhysicalHealth =
    existingCharacter.health.maxPhysicalHealth +
    healthUpdate.rolledPhysicalHealth;
  const newCurrentMentalHealth = Math.min(
    existingCharacter.health.currentMentalHealth +
      healthUpdate.rolledMentalHealth,
    existingCharacter.health.maxMentalHealth + healthUpdate.rolledMentalHealth
  );
  const newRolledMentalHealth =
    existingCharacter.health.rolledMentalHealth +
    healthUpdate.rolledMentalHealth;
  const newMaxMentalHealth =
    existingCharacter.health.maxMentalHealth + healthUpdate.rolledMentalHealth;
  if (newRolledPhysicalHealth > newMaxPhysicalHealth) {
    return {
      error:
        "Current physical health cannot be greater than max physical health",
    };
  }
  if (newRolledMentalHealth > newMaxMentalHealth) {
    return {
      error: "Current mental health cannot be greater than max mental health",
    };
  }

  return {
    newCurrentPhysicalHealth,
    newRolledPhysicalHealth,
    newCurrentMentalHealth,
    newRolledMentalHealth,
    newMaxPhysicalHealth,
    newMaxMentalHealth,
  };
}

export async function calculateNewReactionsPerRound(
  existingCharacterLevel: number,
  existingCharacterId: string
) {
  const newCharacterLevel = existingCharacterLevel + 1;
  if (newCharacterLevel >= 4) {
    const characterFeatures = await getCharacterFeatures(existingCharacterId);
    const legendaryDodger = characterFeatures.find(
      (cf) => cf.feature.name === "Legendary Dodger"
    );
    if (legendaryDodger) {
      if (legendaryDodger.grade >= 5) {
        return 100;
      } else if (legendaryDodger.grade >= 3) {
        return 5;
      } else {
        return 4;
      }
    } else {
      return 3;
    }
  } else if (newCharacterLevel === 3) {
    return 2;
  } else {
    return 1;
  }
}

export function parseCharacterBodyToCompute(
  existingCharacter: CharacterForLevelUp,
  healthUpdate: ReturnType<typeof parseHealthUpdate>,
  reactionsPerRound: number,
  skillImprovement: LevelUpRequest["skillImprovement"],
  attributeChanges: ReturnType<typeof parseAttributeChanges>
) {
  const learnedSkills = skillImprovement
    ? {
        ...existingCharacter.learnedSkills,
        generalSkills: {
          ...existingCharacter.learnedSkills.generalSkills,
          [skillImprovement]:
            ((
              existingCharacter.learnedSkills.generalSkills as Record<
                string,
                number
              >
            )[skillImprovement] ?? 0) + 1,
        },
      }
    : existingCharacter.learnedSkills;

  let innateAttributes = existingCharacter.innateAttributes;
  if (attributeChanges?.length) {
    const applied = applyLevelUpAttributeSwaps(
      existingCharacter.innateAttributes,
      attributeChanges
    );
    if (!applied.ok) {
      return { error: applied.error };
    }
    innateAttributes = applied.innateAttributes;
  }

  const updateBody = {
    generalInformation: {
      ...existingCharacter.generalInformation,
      level: existingCharacter.generalInformation.level + 1,
    },
    health: {
      ...existingCharacter.health,
      currentPhysicalHealth: healthUpdate.newCurrentPhysicalHealth,
      currentMentalHealth: healthUpdate.newCurrentMentalHealth,
      rolledPhysicalHealth: healthUpdate.newRolledPhysicalHealth,
      rolledMentalHealth: healthUpdate.newRolledMentalHealth,
      maxPhysicalHealth: healthUpdate.newMaxPhysicalHealth,
      maxMentalHealth: healthUpdate.newMaxMentalHealth,
    },
    combatInformation: {
      ...combatInformationSchema.parse(existingCharacter.combatInformation),
      reactionsPerRound: reactionsPerRound,
    },
    learnedSkills,
    innateAttributes,
  };
  const parsedUpdateBody = levelUpCharacterBodySchema.safeParse(updateBody);
  if (parsedUpdateBody.error) {
    return { error: parsedUpdateBody.error };
  }

  return { updateBody: parsedUpdateBody.data };
}
