import { prisma } from "./client";

export async function getCharacterFeatures(characterId: string) {
  return prisma.featureCharacter.findMany({
    where: { characterId },
    include: { feature: true },
  });
}

export async function getFeatureCharacterByFeatureId(
  featureId: string,
  characterId: string
) {
  return prisma.featureCharacter.findFirst({
    where: {
      featureId: featureId,
      characterId: characterId,
    },
  });
}
