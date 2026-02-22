import { prisma } from "./client";
import { Prisma } from "@prisma/client";
import { hydrateItemCharacters } from "./itemCharacter";
import {
  CharacterCreationTransactionError,
  CharacterDeletionTransactionError,
  ValidationError,
  serializeError,
} from "../../api/shared/errors";

export async function createCharacter(data: Prisma.CharacterCreateInput) {
  return prisma.character.create({ data });
}

export async function createCharacterWithRelations({
  data,
  userId,
  pathId,
  pathRank,
}: {
  data: Prisma.CharacterCreateInput;
  userId: string;
  pathId: string;
  pathRank: number;
}) {
  return prisma.$transaction(async (tx) => {
    let createdCharacter;
    try {
      createdCharacter = await tx.character.create({ data });
    } catch (error) {
      throw new CharacterCreationTransactionError(
        "createCharacter",
        serializeError(error)
      );
    }

    try {
      await tx.characterUser.create({
        data: { characterId: createdCharacter.id, userId },
      });
    } catch (error) {
      throw new CharacterCreationTransactionError(
        "createCharacterUser",
        serializeError(error)
      );
    }

    try {
      await tx.pathCharacter.create({
        data: {
          characterId: createdCharacter.id,
          pathId,
          rank: pathRank,
        },
      });
    } catch (error) {
      throw new CharacterCreationTransactionError(
        "createPathCharacter",
        serializeError(error)
      );
    }

    return createdCharacter;
  });
}

export async function getCharacter(id: string) {
  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      wallet: true,
      inventory: true,
      paths: { include: { path: true } },
      features: { include: { feature: true } },
    },
  });

  if (!character) return null;

  const hydratedInventory = await hydrateItemCharacters(character.inventory);

  return {
    ...character,
    wallet: character.wallet.map((entry) => ({
      currencyName: entry.currencyName,
      quantity: entry.quantity,
    })),
    inventory: hydratedInventory,
  };
}

export async function updateCharacter(
  id: string,
  data: Prisma.CharacterUpdateInput
) {
  return prisma.character.update({ where: { id }, data });
}

export async function levelUpCharacterWithRelations({
  characterId,
  pathId,
  existingPaths,
  existingFeatures,
  incrementalFeatureIds,
  newFeatureIds,
  characterUpdateData,
}: {
  characterId: string;
  pathId: string;
  existingPaths: Array<{ id: string; path: { id: string } }>;
  existingFeatures: Array<{ id: string; featureId: string }>;
  incrementalFeatureIds: string[];
  newFeatureIds: string[];
  characterUpdateData: Prisma.CharacterUpdateInput;
}) {
  return prisma.$transaction(async (tx) => {
    const isNewPath = !existingPaths.some((path) => path.path.id === pathId);
    if (isNewPath) {
      await tx.pathCharacter.create({
        data: {
          characterId,
          pathId,
          rank: 1,
        },
      });
    } else {
      const pathCharacter = existingPaths.find((path) => path.path.id === pathId);
      if (!pathCharacter) {
        throw new ValidationError("Path character not found");
      }
      await tx.pathCharacter.update({
        where: { id: pathCharacter.id },
        data: { rank: { increment: 1 } },
      });
    }

    for (const featureId of incrementalFeatureIds) {
      const characterFeature = existingFeatures.find((f) => f.featureId === featureId);
      if (!characterFeature) {
        throw new ValidationError("Feature character not found");
      }
      await tx.featureCharacter.update({
        where: { id: characterFeature.id },
        data: { grade: { increment: 1 } },
      });
    }

    for (const newFeatureId of newFeatureIds) {
      await tx.featureCharacter.create({
        data: {
          characterId,
          featureId: newFeatureId,
          grade: 1,
        },
      });
    }

    return tx.character.update({
      where: { id: characterId },
      data: characterUpdateData,
      include: {
        inventory: true,
        paths: { include: { path: true } },
        features: { include: { feature: true } },
      },
    });
  });
}

export async function deleteCharacter(id: string) {
  return prisma.$transaction(async (tx) => {
    try {
      await tx.pathCharacter.deleteMany({ where: { characterId: id } });
    } catch (error) {
      throw new CharacterDeletionTransactionError(
        "deletePathCharacters",
        serializeError(error)
      );
    }

    try {
      await tx.featureCharacter.deleteMany({ where: { characterId: id } });
    } catch (error) {
      throw new CharacterDeletionTransactionError(
        "deleteFeatureCharacters",
        serializeError(error)
      );
    }

    try {
      await tx.gameCharacter.deleteMany({ where: { characterId: id } });
    } catch (error) {
      throw new CharacterDeletionTransactionError(
        "deleteGameCharacters",
        serializeError(error)
      );
    }

    try {
      await tx.characterUser.deleteMany({ where: { characterId: id } });
    } catch (error) {
      throw new CharacterDeletionTransactionError(
        "deleteCharacterUsers",
        serializeError(error)
      );
    }

    try {
      await tx.itemCharacter.deleteMany({ where: { characterId: id } });
    } catch (error) {
      throw new CharacterDeletionTransactionError(
        "deleteCharacterInventory",
        serializeError(error)
      );
    }

    try {
      await tx.characterCurrency.deleteMany({ where: { characterId: id } });
    } catch (error) {
      throw new CharacterDeletionTransactionError(
        "deleteCharacterWallet",
        serializeError(error)
      );
    }

    try {
      await tx.character.delete({ where: { id } });
    } catch (error) {
      throw new CharacterDeletionTransactionError(
        "deleteCharacter",
        serializeError(error)
      );
    }
  });
}
