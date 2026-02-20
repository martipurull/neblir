import { NextResponse } from "next/server";
import { getCharacter } from "@/app/lib/prisma/character";
import { computeCharacterRequestData } from "../../parsing";
import { levelUpRequestSchema } from "./schema";
import {
  areFeaturesValidForLevelUp,
  areIncrementFeaturesValid,
  calculateNewReactionsPerRound,
  parseAttributeChanges,
  parseCharacterBodyToCompute,
  parseHealthUpdate,
} from "./parsing";
import { auth } from "@/auth";
import { AuthNextRequest } from "@/app/lib/types/api";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import { serializeError } from "@/app/api/shared/errors";
import { errorResponse } from "@/app/api/shared/responses";
import logger from "@/logger";
import { ValidationError } from "@/app/api/shared/errors";
import { prisma } from "@/app/lib/prisma/client";

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/level-up",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/level-up",
        message: "Invalid character ID",
        characterId: id,
      });
      return errorResponse("Invalid character ID", 400);
    }
    if (!characterBelongsToUser(id, request.auth.user.id)) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/level-up",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters.", 403);
    }

    const requestBody = await request.json();
    const parseResult = levelUpRequestSchema.safeParse(requestBody);
    if (!parseResult.success) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/level-up",
        message: "Error parsing level up request",
        details: parseResult.error.issues,
      });
      return errorResponse(
        "Invalid request body",
        400,
        JSON.stringify(parseResult.error.issues)
      );
    }

    const existingCharacter = await getCharacter(id);
    if (!existingCharacter) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/level-up",
        message: "Character not found",
        characterId: id,
      });
      return errorResponse("Character not found", 404);
    }

    const parsedBody = parseResult.data;

    const attributeChanges = parseAttributeChanges(parsedBody.attributeChanges);

    const healthUpdate = parseHealthUpdate(
      parsedBody.healthUpdate,
      existingCharacter
    );
    if (
      healthUpdate.error ||
      !healthUpdate.newRolledMentalHealth ||
      !healthUpdate.newRolledPhysicalHealth
    ) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/level-up",
        message: "Invalid health update",
        characterId: id,
        error: healthUpdate.error,
      });
      return errorResponse(healthUpdate.error ?? "Invalid health update", 400);
    }

    // Calculate new number of reactions per round if relevant
    const newReactionsPerRound = await calculateNewReactionsPerRound(
      existingCharacter.generalInformation.level,
      id
    );

    // Construct character body to compute
    const levelUpBodyToCompute = parseCharacterBodyToCompute(
      existingCharacter,
      healthUpdate,
      newReactionsPerRound,
      parsedBody.skillImprovement,
      attributeChanges
    );
    if (levelUpBodyToCompute?.error) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/level-up",
        message: "Error in level up data",
        characterId: id,
        details: levelUpBodyToCompute.error.issues,
      });
      return errorResponse(
        "Error in level up data",
        400,
        JSON.stringify(levelUpBodyToCompute.error.issues)
      );
    }
    const characterUpdateData = computeCharacterRequestData(
      levelUpBodyToCompute.updateBody,
      true
    );

    if (!characterUpdateData) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/level-up",
        message: "Error while computing character level up data",
        characterId: id,
      });
      return errorResponse(
        "Error while computing character level up data.",
        400,
        "Check changes to attributes and learned skills."
      );
    }

    // Validate features before starting the transaction (read-only checks)
    const featureIds = [
      ...parsedBody.newFeatureIds,
      ...parsedBody.incrementalFeatureIds,
    ];
    try {
      const areFeaturesValid = await areFeaturesValidForLevelUp(id, featureIds);
      if (!areFeaturesValid) {
        logger.error({
          method: "POST",
          route: "/api/characters/[id]/level-up",
          message: "Invalid features for level up",
          characterId: id,
        });
        return errorResponse(
          "Invalid features for level up",
          400,
          "Some features do not belong to any of the character's paths, or are for a rank above the character's current path rank."
        );
      }
    } catch (error) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/level-up",
        message: "Error while checking if features are valid for level up",
        characterId: id,
        error,
      });
      return errorResponse(
        "Error while checking if features are valid for level up",
        400,
        serializeError(error)
      );
    }

    if (parsedBody.incrementalFeatureIds.length) {
      const incrementFeaturesAreValid = await areIncrementFeaturesValid(
        id,
        parsedBody.incrementalFeatureIds
      );
      if (!incrementFeaturesAreValid) {
        logger.error({
          method: "POST",
          route: "/api/characters/[id]/level-up",
          message: "Invalid increment features",
          characterId: id,
          incrementalFeatureIds: parsedBody.incrementalFeatureIds,
        });
        return errorResponse("Invalid increment features", 400);
      }
    }

    // All writes run in a single transaction: path, feature grades, new features, character update.
    // If any step fails, the entire level-up is rolled back (no partial path/feature updates).
    let updatedCharacter;
    try {
      updatedCharacter = await prisma.$transaction(async (tx) => {
        const isNewPath = !existingCharacter.paths.some(
          (path) => path.path.id === parsedBody.pathId
        );
        if (isNewPath) {
          await tx.pathCharacter.create({
            data: {
              characterId: id,
              pathId: parsedBody.pathId,
              rank: 1,
            },
          });
        } else {
          const pathCharacter = existingCharacter.paths.find(
            (path) => path.path.id === parsedBody.pathId
          );
          if (!pathCharacter) {
            throw new ValidationError("Path character not found");
          }
          await tx.pathCharacter.update({
            where: { id: pathCharacter.id },
            data: { rank: { increment: 1 } },
          });
        }

        for (const featureId of parsedBody.incrementalFeatureIds) {
          const characterFeature = existingCharacter.features.find(
            (f) => f.featureId === featureId
          );
          if (!characterFeature) {
            throw new ValidationError("Feature character not found");
          }
          await tx.featureCharacter.update({
            where: { id: characterFeature.id },
            data: { grade: { increment: 1 } },
          });
        }

        for (const newFeatureId of parsedBody.newFeatureIds) {
          await tx.featureCharacter.create({
            data: {
              characterId: id,
              featureId: newFeatureId,
              grade: 1,
            },
          });
        }

        return tx.character.update({
          where: { id },
          data: characterUpdateData,
          include: {
            inventory: { include: { item: true } },
            paths: { include: { path: true } },
            features: { include: { feature: true } },
          },
        });
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.error({
          method: "POST",
          route: "/api/characters/[id]/level-up",
          message: "Error while applying level up (validation)",
          characterId: id,
          details: error.message,
        });
        return errorResponse(
          "Error while computing character attributes or skills.",
          400,
          error.message
        );
      }
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/level-up",
        message: "Error while applying level up (transaction rolled back)",
        characterId: id,
        error,
      });
      return errorResponse(
        "Error while applying level up. No changes were saved.",
        500
      );
    }

    return NextResponse.json(updatedCharacter, { status: 200 });
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.error({
        method: "POST",
        route: "/api/characters",
        message: "Error while computing character attributes or skills.",
        details: error.message,
      });
      return errorResponse(
        "Error while computing character attributes or skills.",
        400,
        error.message
      );
    } else {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/level-up",
        message: "Error processing level up request",
        error,
      });
      return errorResponse("Internal Server Error", 500);
    }
  }
});
