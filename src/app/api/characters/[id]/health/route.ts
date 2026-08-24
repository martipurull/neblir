import { applyCharacterHealthPatch } from "@/app/lib/applyCharacterHealthPatch";
import type { CharacterHealthSnapshot } from "@/app/lib/applyCharacterHealthPatch";
import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import { NextResponse } from "next/server";
import { healthUpdateSchema } from "./schema";
import { auth } from "@/auth";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { logger } from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import type { Status } from "@prisma/client";

function toHealthSnapshot(
  health: CharacterDetailHealth
): CharacterHealthSnapshot {
  return {
    currentPhysicalHealth: health.currentPhysicalHealth,
    currentMentalHealth: health.currentMentalHealth,
    maxPhysicalHealth: health.maxPhysicalHealth,
    maxMentalHealth: health.maxMentalHealth,
    seriousPhysicalInjuries: health.seriousPhysicalInjuries,
    seriousTrauma: health.seriousTrauma,
    deathSaves: health.deathSaves ?? { successes: 0, failures: 0 },
    madnessSaves: health.madnessSaves ?? { successes: 0, failures: 0 },
    status: health.status,
  };
}

type CharacterDetailHealth = {
  currentPhysicalHealth: number;
  currentMentalHealth: number;
  maxPhysicalHealth: number;
  maxMentalHealth: number;
  seriousPhysicalInjuries: number;
  seriousTrauma: number;
  deathSaves?: { successes: number; failures: number } | null;
  madnessSaves?: { successes: number; failures: number } | null;
  status: Status;
};

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/health",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/health",
        message: "Invalid character ID",
        characterId: id,
      });
      return errorResponse("Invalid character ID", 400);
    }
    if (!(await characterBelongsToUser(id, request.auth.user.id))) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/health",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters.", 403);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      healthUpdateSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/health",
        message: "Error parsing health update request",
        details: error,
      });
      return errorResponse(
        "Error parsing health update request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const existingCharacter = await getCharacter(id);
    if (!existingCharacter) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/health",
        message: "Character not found",
        characterId: id,
      });
      return errorResponse("Character not found", 404);
    }

    if (
      parsedBody.currentPhysicalHealth != null &&
      parsedBody.currentPhysicalHealth >
        existingCharacter.health.maxPhysicalHealth
    ) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/health",
        message:
          "Current physical health cannot be greater than max physical health",
        characterId: id,
        currentPhysicalHealth: parsedBody.currentPhysicalHealth,
        maxPhysicalHealth: existingCharacter.health.maxPhysicalHealth,
      });
      return errorResponse(
        "Current physical health cannot be greater than max physical health",
        400
      );
    }
    if (
      parsedBody.currentMentalHealth != null &&
      parsedBody.currentMentalHealth > existingCharacter.health.maxMentalHealth
    ) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/health",
        message:
          "Current mental health cannot be greater than max mental health",
        characterId: id,
        currentMentalHealth: parsedBody.currentMentalHealth,
        maxMentalHealth: existingCharacter.health.maxMentalHealth,
      });
      return errorResponse(
        "Current mental health cannot be greater than max mental health",
        400
      );
    }

    const {
      deathSaves: patchDeathSaves,
      madnessSaves: patchMadnessSaves,
      ...restPatch
    } = parsedBody;
    const applied = applyCharacterHealthPatch(
      toHealthSnapshot(existingCharacter.health),
      {
        ...restPatch,
        ...(patchDeathSaves != null ? { deathSaves: patchDeathSaves } : {}),
        ...(patchMadnessSaves != null
          ? { madnessSaves: patchMadnessSaves }
          : {}),
      }
    );
    if (!applied.ok) {
      return errorResponse(applied.error, 400);
    }

    const { madnessSaves, ...healthWithoutOptionalMadness } = applied.health;
    const healthForPrisma = {
      ...existingCharacter.health,
      ...healthWithoutOptionalMadness,
      deathSaves: applied.health.deathSaves,
      ...(madnessSaves != null ? { madnessSaves } : {}),
    };
    await updateCharacter(id, {
      health: healthForPrisma,
    });

    const fullCharacter = await getCharacter(id);
    if (!fullCharacter) {
      return errorResponse("Character not found after update", 500);
    }
    return NextResponse.json(fullCharacter, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/characters/[id]/health",
      message: "Error updating health",
      error,
    });
    return errorResponse("Error updating health", 500, serializeError(error));
  }
});
