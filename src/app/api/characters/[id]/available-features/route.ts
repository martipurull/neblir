// Get character's path ids and PathCharacter ranks with character id
// For each PathCharacter, getFeaturesAvailableForPathCharacter (gets features available for the character's path and pathCharacter rank)
// Combine all unique features (no duplicates) for all PathCharacters
// Return the features

import { getCharacter } from "@/app/lib/prisma/character";
import { getFeaturesAvailableForPathCharacter } from "@/app/lib/prisma/feature";
import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import logger from "@/logger";
import { NextResponse } from "next/server";
import { errorResponse } from "../../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/characters/[id]/available-features",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id: characterId } = (await params) as { id: string };
    if (!characterId || typeof characterId !== "string") {
      logger.error({
        method: "GET",
        route: "/api/characters/[id]/available-features",
        message: "Invalid character ID",
        characterId: characterId,
      });
      return errorResponse("Invalid character ID", 400);
    }
    if (
      !request.auth?.user?.characters
        .map((characterUser) => characterUser.characterId)
        .includes(characterId)
    ) {
      logger.error({
        method: "GET",
        route: "/api/characters/[id]/available-features",
        message: "Character does not belong to user",
        characterId: characterId,
      });
      return errorResponse("This is not one of your characters.", 403);
    }
    const character = await getCharacter(characterId);
    if (!character) {
      logger.error({
        method: "GET",
        route: "/api/characters/[id]/available-features",
        message: "Character not found",
        characterId: characterId,
      });
      return errorResponse("Character not found", 404);
    }

    if (!character?.paths.length) {
      return NextResponse.json([], { status: 200 });
    }

    const allAvailableFeatures = (
      await Promise.all(
        character.paths.map(
          async (path) =>
            await getFeaturesAvailableForPathCharacter(path.pathId, path.rank)
        )
      )
    ).flat();

    const uniqueAvailableFeatures = Array.from(
      new Set(allAvailableFeatures.map((feature) => feature.id))
    )
      .map((id) => allAvailableFeatures.find((feature) => feature.id === id))
      .filter((feature) => feature !== undefined);

    const existingIncrementalFeatures = uniqueAvailableFeatures.filter(
      (feature) =>
        character.features
          .map((characterFeature) => characterFeature.featureId)
          .includes(feature.id) && feature.maxGrade > 1
    );
    const newFeatures = uniqueAvailableFeatures.filter(
      (feature) =>
        !character.features
          .map((characterFeature) => characterFeature.featureId)
          .includes(feature.id)
    );

    return NextResponse.json(
      { existingIncrementalFeatures, newFeatures },
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/characters/[id]/available-features",
      message: "Error fetching available features",
      error,
    });
    return errorResponse("Error fetching available features", 500, JSON.stringify(error));
  }
});
