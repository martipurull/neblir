
import { Prisma } from "@prisma/client";
import { prisma } from "./client";

export async function createFeature(data: Prisma.FeatureUncheckedCreateInput) {
    return prisma.feature.create({ data });
}

export async function getAllFeatures() {
    return prisma.feature.findMany();
}

export async function getFeature(id: string) {
    return prisma.feature.findUnique({ where: { id } })
}

export async function getFeatures(ids: string[]) {
    return prisma.feature.findMany({ where: { id: { in: ids } } })
}

export async function getFeaturesAvailableForPathCharacter(pathId: string, pathCharacterLevel: number) {
    return prisma.feature.findMany({
        where: {
            applicablePaths: {
                some: {
                    pathId: pathId,
                }
            },
            level: { lte: pathCharacterLevel }
        }
    })
}

export async function deleteFeature(id: string) {
    return prisma.feature.delete({ where: { id } });
}