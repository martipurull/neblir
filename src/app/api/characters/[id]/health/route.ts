import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import { NextResponse } from "next/server";
import { healthUpdateSchema } from "./schema";
import { auth } from "@/auth";
import { AuthNextRequest } from "@/app/lib/types/api";
import logger from "@/logger";
import { errorResponse } from "../../../shared/responses";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";

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
    if (!characterBelongsToUser(id, request.auth.user.id)) {
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
      parsedBody.currentPhysicalHealth &&
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
      parsedBody.currentMentalHealth &&
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

    let newHealth = {
      ...existingCharacter.health,
      ...parsedBody,
    };
    if (parsedBody.seriousTrauma === 3) {
      newHealth = { ...newHealth, status: "DERANGED" };
    }
    if (
      parsedBody.deathSaves?.failures === 3 ||
      parsedBody.seriousPhysicalInjuries === 3
    ) {
      newHealth = { ...newHealth, status: "DECEASED" };
    }
    const updatedCharacter = await updateCharacter(id, { health: newHealth });

    return NextResponse.json(updatedCharacter, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/characters/[id]/health",
      message: "Error updating health",
      error,
    });
    return errorResponse("Error updating health", 500, JSON.stringify(error));
  }
});
