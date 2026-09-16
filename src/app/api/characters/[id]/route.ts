import { deleteCharacter, getCharacter } from "@/app/lib/prisma/character";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import { logger } from "@/logger";
import { characterEditableUpdateSchema } from "../schemas";
import { computeCharacterRequestData } from "../parsing";
import { getPath } from "@/app/lib/prisma/path";
import { getFeatures } from "@/app/lib/prisma/feature";
import { prisma } from "@/app/lib/prisma/client";
import type { PathName } from "@prisma/client";
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

    const updatePayload = parseResult.data;
    const submittedPaths = updatePayload.paths;
    const rawInitialFeatures = updatePayload.initialFeatures ?? [];
    const level = updatePayload.generalInformation.level;

    const submittedPathIds = submittedPaths.map((path) => path.pathId);
    if (new Set(submittedPathIds).size !== submittedPathIds.length) {
      return errorResponse("Duplicate paths are not allowed", 400);
    }

    const resolvedPaths: Array<{
      pathId: string;
      rank: number;
      name: PathName;
    }> = [];
    for (const submitted of submittedPaths) {
      const path = await getPath(submitted.pathId);
      if (!path) {
        return errorResponse("Path not found", 400);
      }
      resolvedPaths.push({
        pathId: submitted.pathId,
        rank: submitted.rank,
        name: path.name,
      });
    }

    const rankSum = resolvedPaths.reduce((sum, path) => sum + path.rank, 0);
    const unallocatedLevel = level - rankSum;
    if (unallocatedLevel > 0) {
      return errorResponse(
        `Unallocated level is ${unallocatedLevel}. Assign all level to path ranks before saving.`,
        400
      );
    }
    if (unallocatedLevel < 0) {
      return errorResponse(
        `Path ranks exceed level by ${-unallocatedLevel}. Reduce ranks or raise level before saving.`,
        400
      );
    }

    const featureIds = rawInitialFeatures.map((entry) => entry.featureId);
    const catalogueFeatures =
      featureIds.length > 0 ? await getFeatures(featureIds) : [];
    const featureMap = new Map(
      catalogueFeatures.map((feature) => [feature.id, feature])
    );

    let gradeSum = 0;
    for (const entry of rawInitialFeatures) {
      if (
        typeof entry?.featureId !== "string" ||
        typeof entry?.grade !== "number" ||
        entry.grade < 1
      ) {
        return errorResponse("Invalid initialFeatures entry", 400);
      }
      const feature = featureMap.get(entry.featureId);
      if (!feature) {
        return errorResponse(
          "One or more features were not found in the catalogue",
          400
        );
      }
      const isLegal = resolvedPaths.some(
        (path) =>
          feature.applicablePaths.includes(path.name) &&
          path.rank >= feature.minPathRank
      );
      if (!isLegal) {
        return errorResponse(
          `Feature ${feature.name} is not legal for the submitted paths and ranks`,
          400
        );
      }
      if (entry.grade > feature.maxGrade) {
        return errorResponse(
          `Feature ${feature.name} grade exceeds max (${feature.maxGrade})`,
          400
        );
      }
      gradeSum += entry.grade;
    }
    const featureSlots = Math.max(0, 2 * (level - 1));
    if (gradeSum > featureSlots) {
      return errorResponse(
        "Total feature grades cannot exceed character feature grade slots",
        400
      );
    }

    let computed: ReturnType<typeof computeCharacterRequestData>;
    try {
      computed = computeCharacterRequestData(updatePayload, false, {
        preservePlayState: {
          currentPhysicalHealth: existingCharacter.health.currentPhysicalHealth,
          currentMentalHealth: existingCharacter.health.currentMentalHealth,
          deathSaves: existingCharacter.health.deathSaves ?? {
            successes: 0,
            failures: 0,
          },
          madnessSaves: existingCharacter.health.madnessSaves ?? {
            successes: 0,
            failures: 0,
          },
          reactionsRemaining:
            existingCharacter.combatInformation.reactionsRemaining,
        },
      });
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
      const nextWallet = updatePayload.wallet ?? [];
      if (nextWallet.length > 0) {
        await tx.characterCurrency.createMany({
          data: nextWallet.map((entry) => ({
            characterId: id,
            currencyName: entry.currencyName,
            quantity: entry.quantity,
          })),
        });
      }

      const existingPaths = existingCharacter.paths ?? [];
      const submittedPathIdSet = new Set(
        resolvedPaths.map((path) => path.pathId)
      );

      for (const submitted of resolvedPaths) {
        const matchingPath = existingPaths.find(
          (path) => path.id === submitted.pathId
        );
        if (matchingPath?.pathCharacterId) {
          await tx.pathCharacter.update({
            where: { id: matchingPath.pathCharacterId },
            data: { rank: submitted.rank },
          });
        } else {
          await tx.pathCharacter.create({
            data: {
              characterId: id,
              pathId: submitted.pathId,
              rank: submitted.rank,
            },
          });
        }
      }

      for (const existing of existingPaths) {
        if (existing.pathCharacterId && !submittedPathIdSet.has(existing.id)) {
          await tx.pathCharacter.delete({
            where: { id: existing.pathCharacterId },
          });
        }
      }

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
