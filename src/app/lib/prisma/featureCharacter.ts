import { Prisma } from "@prisma/client";
import { prisma } from "./client";

export async function createFeatureCharacter(data: Prisma.FeatureCharacterUncheckedCreateInput) {
    return prisma.featureCharacter.create({ data });
}

export async function getCharacterFeatures(characterId: string) {
    return prisma.featureCharacter.findMany({ where: { characterId }, include: { feature: true } })
}

export async function getFeatureCharacter(id: string) {
    return prisma.featureCharacter.findUnique({ where: { id } })
}

export async function getFeatureCharacterByFeatureId(featureId: string, characterId: string) {
    return prisma.featureCharacter.findFirst(
        {
            where: {
                featureId: featureId,
                characterId: characterId
            }
        })
}

export async function increaseFeatureCharacterGrade(id: string) {
    return prisma.featureCharacter.update({
        where: { id },
        data: { grade: { increment: 1 } }
    });
}

export async function deleteFeatureCharacter(id: string) {
    return prisma.featureCharacter.delete({ where: { id } });
}