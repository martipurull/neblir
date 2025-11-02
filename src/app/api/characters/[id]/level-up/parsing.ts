import { Character } from "@prisma/client";
import { levelUpCharacterBodySchema, LevelUpRequest } from "./schema";
import { getFeatures } from "@/app/lib/prisma/feature";
import {
  getCharacterFeatures,
  getFeatureCharacterByFeatureId,
} from "@/app/lib/prisma/featureCharacter";

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
  existingCharacter: Character
) {
  const newRolledPhysicalHealth =
    existingCharacter.health.rolledPhysicalHealth +
    healthUpdate.rolledPhysicalHealth;
  const newRolledMentalHealth =
    existingCharacter.health.rolledMentalHealth +
    healthUpdate.rolledMentalHealth;
  if (newRolledPhysicalHealth > existingCharacter.health.maxPhysicalHealth) {
    return {
      error:
        "Current physical health cannot be greater than max physical health",
    };
  }
  if (newRolledMentalHealth > existingCharacter.health.maxMentalHealth) {
    return {
      error: "Current mental health cannot be greater than max mental health",
    };
  }

  return {
    newRolledPhysicalHealth,
    newRolledMentalHealth,
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
  existingCharacter: Character,
  healthUpdate: ReturnType<typeof parseHealthUpdate>,
  reactionsPerRound: number,
  skillImprovement: LevelUpRequest["skillImprovement"],
  attributeChanges: ReturnType<typeof parseAttributeChanges>
) {
  const updateBody = {
    ...existingCharacter,
    generalInformation: {
      ...existingCharacter.generalInformation,
      level: existingCharacter.generalInformation.level + 1,
    },
    health: {
      ...existingCharacter.health,
      rolledPhysicalHealth: healthUpdate.newRolledPhysicalHealth,
      rolledMentalHealth: healthUpdate.newRolledMentalHealth,
    },
    combatInformation: {
      ...existingCharacter.combatInformation,
      reactionsPerRound: reactionsPerRound,
    },
    ...(skillImprovement && {
      learnedSkills: {
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
      },
    }),
    ...(attributeChanges &&
      attributeChanges.length && {
        innateAttributes: {
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
        },
      }),
  };
  const parsedUpdateBody = levelUpCharacterBodySchema.safeParse(updateBody);
  if (parsedUpdateBody.error) {
    return { error: parsedUpdateBody.error };
  }
  return { updateBody: parsedUpdateBody.data };
}
