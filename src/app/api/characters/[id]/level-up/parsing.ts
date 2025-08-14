import { Character } from "@prisma/client";
import { levelUpCharacterBodySchema, LevelUpRequest } from "./schema";
import { getFeatures } from "@/app/lib/prisma/feature";
import { getFeatureCharacterByFeatureId } from "@/app/lib/prisma/featureCharacter";

export async function areIncrementFeaturesValid(featureIds: string[], characterId: string) {
    const existingFeatures = await getFeatures(featureIds)
    const invalidFeatureCharacters = await Promise.all(existingFeatures.filter(async (feature) => {
        const featureCharacter = await getFeatureCharacterByFeatureId(feature.id, characterId)
        if (featureCharacter && featureCharacter.grade + 1 > feature.maxGrade) {
            return true
        }
        return false
    }))

    return invalidFeatureCharacters.length === 0
}

export function parseAttributeChanges(levelUpRequest: LevelUpRequest) {
    const fromParts = levelUpRequest?.attributeChanges?.[0]?.from?.split('.') ?? undefined;
    const toParts = levelUpRequest?.attributeChanges?.[0]?.to?.split('.') ?? undefined;
    if (!fromParts || !toParts) {
        return undefined;
    }
    return {
        from: {
            attribute: fromParts[0],
            property: fromParts[1],
        },
        to: {
            attribute: toParts[0],
            property: toParts[1],
        },
    }
}

export function parseHealthUpdate(healthUpdate: LevelUpRequest['healthUpdate'], existingCharacter: Character) {
    const newRolledPhysicalHealth = existingCharacter.health.rolledPhysicalHealth + healthUpdate.rolledPhysicalHealth;
    const newRolledMentalHealth = existingCharacter.health.rolledMentalHealth + healthUpdate.rolledMentalHealth;
    if (newRolledPhysicalHealth > existingCharacter.health.maxPhysicalHealth) {
        return { error: 'Current physical health cannot be greater than max physical health' }
    }
    if (newRolledMentalHealth > existingCharacter.health.maxMentalHealth) {
        return { error: 'Current mental health cannot be greater than max mental health' }
    }

    return {
        newRolledPhysicalHealth,
        newRolledMentalHealth,
    }
}

export function parseCharacterBodyToCompute(
    existingCharacter: Character,
    attributeChanges: ReturnType<typeof parseAttributeChanges>,
    healthUpdate: ReturnType<typeof parseHealthUpdate>,
    skillImprovement: LevelUpRequest['skillImprovement']
) {
    // instead of returning the constrcted object,
    // safeParse it first with zod to strip any unrecognised keys, such as the id, 
    // which will otherwise be rejected when included in the update body for prisma
    const updateBody = {
        ...existingCharacter,
        generalInformation: {
            ...existingCharacter.generalInformation,
            level: existingCharacter.generalInformation.level + 1,
        },
        health: {
            ...existingCharacter.health,
            rolledPhysicalHealth: healthUpdate.newRolledPhysicalHealth ?? 0,
            rolledMentalHealth: healthUpdate.newRolledMentalHealth ?? 0,
        },
        ...(attributeChanges && {
            innateAttributes: {
                ...existingCharacter.innateAttributes,
                [`${attributeChanges.from.attribute}.${attributeChanges.from.property}`]: (existingCharacter.innateAttributes[attributeChanges.from.attribute as keyof typeof existingCharacter.innateAttributes] as Record<string, number>)[attributeChanges.from.property] - 1,
                [`${attributeChanges.to.attribute}.${attributeChanges.to.property}`]: (existingCharacter.innateAttributes[attributeChanges.to.attribute as keyof typeof existingCharacter.innateAttributes] as Record<string, number>)[attributeChanges.to.property] + 1,
            }
        }),
        ...(skillImprovement && {
            learnedSkills: {
                ...existingCharacter.learnedSkills,
                generalSkills: {
                    ...existingCharacter.learnedSkills.generalSkills,
                    [skillImprovement]: (existingCharacter.learnedSkills.generalSkills as Record<string, number>)[skillImprovement] + 1,
                }
            }
        })
    }
    const parsedUpdateBody = levelUpCharacterBodySchema.safeParse(updateBody)
    if (parsedUpdateBody.error) {
        return { error: parsedUpdateBody.error }
    }
    return { updateBody: parsedUpdateBody.data }
}