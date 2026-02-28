import { NextResponse } from "next/server";
import { characterCreationRequestSchema } from "./schemas";
import { computeCharacterRequestData } from "./parsing";
import { auth } from "@/auth";
import { AuthNextRequest } from "@/app/lib/types/api";
import { Prisma } from "@prisma/client";
import { getUser } from "@/app/lib/prisma/user";
import {
  createCharacterWithRelations,
  getCharactersByUserId,
} from "@/app/lib/prisma/character";
import {
  CharacterCreationTransactionError,
  serializeError,
} from "../shared/errors";
import { errorResponse } from "../shared/responses";
import { ValidationError } from "../shared/errors";
import logger from "@/logger";

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    const userId = request.auth?.user?.id;
    if (!userId) {
      logger.error({
        method: "GET",
        route: "/api/characters",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const characters = await getCharactersByUserId(userId);

    return NextResponse.json(
      characters.map((character) => ({
        id: character.id,
        name: character.generalInformation.name,
        surname: character.generalInformation.surname,
        level: character.generalInformation.level,
        paths: character.paths.map((pathCharacter) => pathCharacter.path.name),
        avatarKey: character.generalInformation.avatarKey,
      })),
      { status: 200 }
    );
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/characters",
      message: "Error fetching user characters",
      error,
    });
    return errorResponse(
      "Error fetching user characters",
      500,
      serializeError(error)
    );
  }
});

export const POST = auth(async (request: AuthNextRequest) => {
  const user = request.auth?.user;

  try {
    if (!user || !user.id) {
      logger.error({
        method: "POST",
        route: "/api/characters",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const dbUser = await getUser(user.id);
    if (!dbUser) {
      logger.error({
        method: "POST",
        route: "/api/characters",
        message: "No user found in DB",
      });
      return errorResponse("No user found in DB", 404);
    }

    const requestBody = await request.json();
    const parseResult = characterCreationRequestSchema.safeParse(requestBody);
    if (!parseResult.success) {
      logger.error({
        method: "POST",
        route: "/api/characters",
        message: "Error parsing character creation request",
        details: parseResult.error,
      });
      return errorResponse(
        "Error parsing character creation request",
        400,
        JSON.stringify(parseResult.error)
      );
    }

    let characterCreationData;
    try {
      characterCreationData = computeCharacterRequestData(parseResult.data);
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
          route: "/api/characters",
          message: "Error while computing character creation data",
          details: error,
        });
        return errorResponse(
          "Error while computing character creation data",
          500,
          serializeError(error)
        );
      }
    }

    const characterCreateData =
      characterCreationData as Prisma.CharacterCreateInput;

    const character = await createCharacterWithRelations({
      data: characterCreateData,
      userId: user.id,
      pathId: parseResult.data.path.pathId,
      pathRank: parseResult.data.path.rank,
    });

    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    if (error instanceof CharacterCreationTransactionError) {
      logger.error({
        method: "POST",
        route: "/api/characters",
        message: "Character creation transaction step failed",
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
      method: "POST",
      route: "/api/characters",
      message: "characters route POST error",
      details: error,
    });
    return errorResponse(
      "characters route POST error: ",
      500,
      serializeError(error)
    );
  }
});
