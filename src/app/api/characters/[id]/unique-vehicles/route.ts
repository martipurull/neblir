import { getCharacter } from "@/app/lib/prisma/character";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import {
  createUniqueVehicle,
  uniqueVehicleCreateDataFromParsed,
} from "@/app/lib/prisma/uniqueVehicle";
import { createVehicleCharacter } from "@/app/lib/prisma/vehicleCharacter";
import { getCustomVehicle, getVehicle } from "@/app/lib/prisma/vehicle";
import { uniqueVehicleCreateSchema } from "@/app/lib/types/vehicle";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { logger } from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    const { id: characterId } = (await params) as { id: string };
    if (!characterId || typeof characterId !== "string") {
      return errorResponse("Invalid character ID", 400);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      uniqueVehicleCreateSchema.safeParse(requestBody);
    if (error) {
      return errorResponse(
        "Error parsing unique vehicle creation request",
        400,
        error.issues.map((i) => i.message).join(". ")
      );
    }

    const character = await getCharacter(characterId);
    if (!character) {
      return errorResponse("Character not found", 404);
    }

    const game = await getGame(parsedBody.gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }

    const isOwner = await characterBelongsToUser(characterId, userId);
    const isGameMaster = game.gameMaster === userId;
    if (!isOwner && !isGameMaster) {
      return errorResponse(
        "You can only create unique vehicles for your own character unless you are the game master.",
        403
      );
    }

    const characterInGame = character.games?.some(
      (entry) => entry.game.id === parsedBody.gameId
    );
    if (!characterInGame) {
      return errorResponse(
        "Character is not linked to the supplied game.",
        400
      );
    }

    const actingUserInGame =
      isGameMaster || (await userIsInGame(parsedBody.gameId, userId));
    if (!actingUserInGame) {
      return errorResponse(
        "You must be part of the supplied game to create a unique vehicle in it.",
        403
      );
    }

    let baseMaxHp: number | null = null;

    if (parsedBody.sourceType === "STANDALONE") {
      baseMaxHp = parsedBody.maxHpOverride ?? null;
    } else if (parsedBody.sourceType === "CUSTOM_VEHICLE") {
      const template = await getCustomVehicle(parsedBody.vehicleId);
      if (!template) {
        return errorResponse("Template custom vehicle not found", 404);
      }
      if (template.gameId !== parsedBody.gameId) {
        return errorResponse(
          "Template custom vehicle must belong to the supplied game.",
          400
        );
      }
      if (!isGameMaster && template.membersCanModify !== true) {
        return errorResponse(
          "The game master has not allowed members to create unique vehicles from this custom template.",
          403
        );
      }
      baseMaxHp = template.maxHp ?? null;
    }

    if (parsedBody.sourceType === "GLOBAL_VEHICLE") {
      const template = await getVehicle(parsedBody.vehicleId);
      if (!template) {
        return errorResponse("Template vehicle not found", 404);
      }
      baseMaxHp = template.maxHp ?? null;
    }

    const uniqueVehicle = await createUniqueVehicle(
      uniqueVehicleCreateDataFromParsed(userId, parsedBody.gameId, parsedBody)
    );

    const initialCurrentHp = parsedBody.maxHpOverride ?? baseMaxHp ?? 0;
    await createVehicleCharacter(
      characterId,
      "UNIQUE_VEHICLE",
      uniqueVehicle.id,
      {
        currentHp: initialCurrentHp,
      }
    );

    return NextResponse.json({ id: uniqueVehicle.id }, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/characters/[id]/unique-vehicles",
      message: "Error creating unique vehicle for character",
      error,
    });
    return errorResponse(
      "Error creating unique vehicle for character",
      500,
      serializeError(error)
    );
  }
});
