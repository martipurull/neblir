import { levelUpCharacterBodySchema, LevelUpRequest } from "./schema";
import { getFeatures } from "@/app/lib/prisma/feature";
import {
  getCharacterFeatures,
  getFeatureCharacterByFeatureId,
} from "@/app/lib/prisma/featureCharacter";
import { getCharacterPaths } from "@/app/lib/prisma/pathCharacter";
import { Character } from "@/app/lib/types/character";

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
  featureIds?: string[]
) {
  if (!featureIds || !featureIds.length) {
    return false;
  }
  const existingFeatures = await getFeatures(featureIds);
  const characterPaths = await getCharacterPaths(characterId);
  let featureValidationChecks = [];
  for (const feature of existingFeatures) {
    featureValidationChecks.push(
      characterPaths.some(
        (path) =>
          feature.applicablePaths.includes(path.path.name) &&
          // The minPathRank needs to account for the rank after level up (hence the +1)
          path.rank + 1 >= feature.minPathRank
      )
    );
  }
  return featureValidationChecks.every((check) => check);
}

export async function areIncrementFeaturesValid(
  characterId: string,
  featureIds?: string[]
) {
  if (!featureIds || !featureIds.length) {
    return false;
  }
  const existingFeatures = await getFeatures(featureIds);
  const incrementFeatureChecks = await Promise.all(
    existingFeatures.map(async (feature) => {
      const featureCharacter = await getFeatureCharacterByFeatureId(
        feature.id,
        characterId
      );
      return featureCharacter && featureCharacter.grade + 1 <= feature.maxGrade;
    })
  );

  return incrementFeatureChecks.every((valid) => valid);
}

export function parseAttributeChanges(
  attributeChanges: LevelUpRequest["attributeChanges"]
) {
  if (!attributeChanges || !attributeChanges.length) {
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

export function parseHealthUpdate(
  healthUpdate: LevelUpRequest["healthUpdate"],
  existingCharacter: CharacterForLevelUp
) {
  const newRolledPhysicalHealth =
    existingCharacter.health.rolledPhysicalHealth +
    healthUpdate.rolledPhysicalHealth;
  const newMaxPhysicalHealth =
    existingCharacter.health.maxPhysicalHealth +
    healthUpdate.rolledPhysicalHealth;
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
    newRolledPhysicalHealth,
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

  const innateAttributes =
    attributeChanges && attributeChanges.length
      ? {
          ...existingCharacter.innateAttributes,
          ...attributeChanges.reduce(
            (acc, change) => {
              const fromCurrent =
                (
                  existingCharacter.innateAttributes[
                    change.from
                      .attribute as keyof typeof existingCharacter.innateAttributes
                  ] as Record<string, number>
                )[change.from.property] ?? 2;
              const toCurrent =
                (
                  existingCharacter.innateAttributes[
                    change.to
                      .attribute as keyof typeof existingCharacter.innateAttributes
                  ] as Record<string, number>
                )[change.to.property] ?? 1;
              acc[`${change.from.attribute}.${change.from.property}`] =
                fromCurrent - 1;
              acc[`${change.to.attribute}.${change.to.property}`] =
                toCurrent + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
        }
      : existingCharacter.innateAttributes;

  const updateBody = {
    generalInformation: {
      ...existingCharacter.generalInformation,
      level: existingCharacter.generalInformation.level + 1,
    },
    health: {
      ...existingCharacter.health,
      rolledPhysicalHealth: healthUpdate.newRolledPhysicalHealth,
      rolledMentalHealth: healthUpdate.newRolledMentalHealth,
      maxPhysicalHealth: healthUpdate.newMaxPhysicalHealth,
      maxMentalHealth: healthUpdate.newMaxMentalHealth,
    },
    combatInformation: {
      ...existingCharacter.combatInformation,
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
