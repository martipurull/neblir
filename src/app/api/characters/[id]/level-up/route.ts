import { NextResponse } from "next/server";
import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import { computeFieldsOnCharacterCreation } from "../../parsing";
import { levelUpRequestSchema } from "./schema";
import {
  areIncrementFeaturesValid,
  calculateNewReactionsPerRound,
  parseAttributeChanges,
  parseCharacterBodyToCompute,
  parseHealthUpdate,
} from "./parsing";
import { auth } from "@/auth";
import { AuthNextRequest } from "@/app/lib/types/api";
import { characterBelongsToUser } from "../../checks";
import {
  createPathCharacter,
  updatePathCharacter,
} from "@/app/lib/prisma/pathCharacter";
import {
  createFeatureCharacter,
  increaseFeatureCharacterGrade,
} from "@/app/lib/prisma/featureCharacter";
import { errorResponse } from "@/app/api/shared/responses";
import logger from "@/logger";

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

    const id = await Promise.resolve(params?.id);
    if (!id || typeof id !== "string") {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/level-up",
        message: "Invalid character ID",
        characterId: id,
      });
      return errorResponse("Invalid character ID", 400);
    }
    if (!characterBelongsToUser(request.auth?.user?.characters, id)) {
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

    const characterUpdateData = computeFieldsOnCharacterCreation(
      levelUpBodyToCompute.updateBody
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

    // If the pathId is not present, create a new PathCharacter record at rank 1
    try {
      const isNewPath = !existingCharacter.paths.some(
        (path) => path.id === parsedBody.pathId
      );
      if (isNewPath) {
        await createPathCharacter({
          characterId: id,
          pathId: parsedBody.pathId,
          rank: 1,
        });
      } else {
        // If the pathId is already present in the character's paths prop, increase its rank by 1
        await updatePathCharacter(parsedBody.pathId, {
          rank: { increment: 1 },
        });
      }
    } catch (error) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/level-up",
        message: "Error while creating or updating path character",
        characterId: id,
        error,
      });
      return errorResponse(
        "Error while creating or updating path character",
        500
      );
    }

    // Increment grade of existing features if present and not already at max grade
    const incrementFeaturesAreValid = await areIncrementFeaturesValid(
      id,
      parsedBody.incrementalFeatureIds
    );

    if (incrementFeaturesAreValid) {
      try {
        await Promise.all(
          parsedBody.incrementalFeatureIds.map((featureId) => {
            return increaseFeatureCharacterGrade(featureId);
          })
        );
      } catch (error) {
        logger.error({
          method: "POST",
          route: "/api/characters/[id]/level-up",
          message: "Error while increasing feature character grades",
          characterId: id,
          error,
        });
        return errorResponse(
          "Error while increasing feature character grades",
          500
        );
      }
    } else {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/level-up",
        message: "Invalid increment features",
        characterId: id,
        incrementalFeatureIds: parsedBody.incrementalFeatureIds,
      });
      return errorResponse("Invalid increment features", 400);
    }

    // Create CharacterFeature records for the each newFeatureId in the request body at grade 1
    if (parsedBody.newFeatureIds.length) {
      try {
        await Promise.all(
          parsedBody.newFeatureIds.map((newFeatureId) => {
            return createFeatureCharacter({
              characterId: id,
              featureId: newFeatureId,
              grade: 1,
            });
          })
        );
      } catch (error) {
        logger.error({
          method: "POST",
          route: "/api/characters/[id]/level-up",
          message: "Error while creating feature character",
          characterId: id,
          error,
        });
        return errorResponse("Error while creating feature character", 500);
      }
    }

    const updatedCharacter = await updateCharacter(id, characterUpdateData);

    return NextResponse.json(updatedCharacter, { status: 200 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/characters/[id]/level-up",
      message: "Error processing level up request",
      error,
    });
    return errorResponse("Internal Server Error", 500);
  }
});
