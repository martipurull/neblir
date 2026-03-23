import { deleteCharacter, getCharacter } from "@/app/lib/prisma/character";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import logger from "@/logger";
import { characterCreationRequestSchema } from "../schemas";
import { computeCharacterRequestData } from "../parsing";
import { getPath } from "@/app/lib/prisma/path";
import { getAllFeaturesAvailableForPathAndRank } from "@/app/lib/prisma/feature";
import { prisma } from "@/app/lib/prisma/client";
import {
  CharacterDeletionTransactionError,
  ValidationError,
  serializeError,
} from "../../shared/errors";
import { errorResponse } from "../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/characters/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };

    if (!id || typeof id !== "string") {
      logger.error({
        method: "GET",
        route: "/api/characters/[id]",
        message: "Invalid character ID",
      });
      return errorResponse("Invalid character ID.", 400);
    }

    if (!(await characterBelongsToUser(id, request.auth.user.id))) {
      logger.error({
        method: "GET",
        route: "/api/characters/[id]",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters", 403);
    }

    const character = await getCharacter(id);

    if (!character) {
      logger.error({
        method: "GET",
        route: "/api/characters/[id]",
        message: "Character not found",
        characterId: id,
      });
      return errorResponse("Character not found", 404);
    }

    return NextResponse.json(character, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/characters/[id]",
      message: "Error fetching character",
      error,
    });
    return errorResponse(
      "Error fetching character",
      500,
      serializeError(error)
    );
  }
});

const characterEditableUpdateSchema = characterCreationRequestSchema;

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]",
        message: "Invalid character ID",
      });
      return errorResponse("Invalid character ID.", 400);
    }

    if (!(await characterBelongsToUser(id, request.auth.user.id))) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters", 403);
    }

    const existingCharacter = await getCharacter(id);
    if (!existingCharacter) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]",
        message: "Character not found",
        characterId: id,
      });
      return errorResponse("Character not found", 404);
    }

    const requestBody = await request.json();
    const parseResult = characterEditableUpdateSchema.safeParse(requestBody);
    if (!parseResult.success) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]",
        message: "Error parsing character update request",
        details: parseResult.error,
      });
      return errorResponse(
        "Error parsing character update request",
        400,
        JSON.stringify(parseResult.error)
      );
    }

    const pathId = parseResult.data.path.pathId;
    const pathRank = parseResult.data.path.rank;
    const rawInitialFeatures = parseResult.data.initialFeatures ?? [];

    const path = await getPath(pathId);
    if (!path) {
      return errorResponse("Path not found", 400);
    }

    const availableFeatures = await getAllFeaturesAvailableForPathAndRank(
      path.name,
      pathRank
    );
    const availableIds = new Set(availableFeatures.map((f) => f.id));
    const featureMap = new Map(availableFeatures.map((f) => [f.id, f]));

    let gradeSum = 0;
    for (const entry of rawInitialFeatures) {
      if (
        typeof entry?.featureId !== "string" ||
        typeof entry?.grade !== "number" ||
        entry.grade < 1
      ) {
        return errorResponse("Invalid initialFeatures entry", 400);
      }
      if (!availableIds.has(entry.featureId)) {
        return errorResponse(
          "One or more features are not available for the selected path and rank",
          400
        );
      }
      const feature = featureMap.get(entry.featureId);
      if (feature && entry.grade > feature.maxGrade) {
        return errorResponse(
          `Feature ${feature.name} grade exceeds max (${feature.maxGrade})`,
          400
        );
      }
      gradeSum += entry.grade;
    }
    const featureSlots = Math.max(0, 2 * (pathRank - 1));
    if (gradeSum > featureSlots) {
      return errorResponse(
        "Total feature grades cannot exceed character feature slots",
        400
      );
    }

    let computed: ReturnType<typeof computeCharacterRequestData>;
    try {
      computed = computeCharacterRequestData(parseResult.data);
    } catch (error) {
      if (error instanceof ValidationError) {
        return errorResponse(error.message, 400);
      }
      return errorResponse(
        "Error while computing character update data",
        500,
        serializeError(error)
      );
    }

    const {
      wallet: _walletRelation,
      notes: _notes,
      ...updatableCharacterData
    } = computed;

    await prisma.$transaction(async (tx) => {
      await tx.characterCurrency.deleteMany({ where: { characterId: id } });
      const nextWallet = parseResult.data.wallet ?? [];
      if (nextWallet.length > 0) {
        await tx.characterCurrency.createMany({
          data: nextWallet.map((entry) => ({
            characterId: id,
            currencyName: entry.currencyName,
            quantity: entry.quantity,
          })),
        });
      }

      await tx.pathCharacter.deleteMany({ where: { characterId: id } });
      await tx.pathCharacter.create({
        data: {
          characterId: id,
          pathId,
          rank: pathRank,
        },
      });

      await tx.featureCharacter.deleteMany({ where: { characterId: id } });
      if (rawInitialFeatures.length > 0) {
        await tx.featureCharacter.createMany({
          data: rawInitialFeatures.map((entry) => ({
            characterId: id,
            featureId: entry.featureId,
            grade: entry.grade,
          })),
        });
      }

      await tx.character.update({
        where: { id },
        data: updatableCharacterData,
      });
    });

    const fullCharacter = await getCharacter(id);
    if (!fullCharacter) {
      return errorResponse("Character not found after update", 500);
    }
    return NextResponse.json(fullCharacter, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/characters/[id]",
      message: "Error updating character",
      error,
    });
    return errorResponse(
      "Error updating character",
      500,
      serializeError(error)
    );
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]",
        message: "Unauthorised",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };

    if (!id || typeof id !== "string") {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]",
        message: "Invalid character ID",
        characterId: id,
      });
      return errorResponse("Invalid character ID.", 400);
    }

    if (!(await characterBelongsToUser(id, request.auth.user.id))) {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters", 403);
    }

    await deleteCharacter(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof CharacterDeletionTransactionError) {
      logger.error({
        method: "DELETE",
        route: "/api/characters/[id]",
        message: "Character deletion transaction step failed",
        step: error.step,
        details: error.details,
      });
      return errorResponse(
        `Error while running ${error.step}`,
        500,
        error.details
      );
    }

    logger.error({
      method: "DELETE",
      route: "/api/characters/[id]",
      message: "Error deleting character",
      error,
    });
    return errorResponse(
      "Error deleting character",
      500,
      serializeError(error)
    );
  }
});
