import { getGame } from "@/app/lib/prisma/game";
import { getCustomVehicle, getVehicle } from "@/app/lib/prisma/vehicle";
import {
  createUniqueVehicle,
  uniqueVehicleCreateDataFromParsed,
} from "@/app/lib/prisma/uniqueVehicle";
import { uniqueVehicleCreateSchema } from "@/app/lib/types/vehicle";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { logger } from "@/logger";
import { serializeError } from "../shared/errors";
import { errorResponse } from "../shared/responses";

/**
 * Create a unique vehicle for a game without attaching it to a character.
 * Mirror of POST /api/unique-items for the GM catalogue flow.
 */
export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    if (!userId) return errorResponse("User ID not found", 400);

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

    const game = await getGame(parsedBody.gameId);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== userId) {
      return errorResponse(
        "Only the game master can create unique vehicles for this game without a character",
        403
      );
    }

    if (parsedBody.sourceType === "CUSTOM_VEHICLE") {
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
    }

    if (parsedBody.sourceType === "GLOBAL_VEHICLE") {
      const template = await getVehicle(parsedBody.vehicleId);
      if (!template) {
        return errorResponse("Template vehicle not found", 404);
      }
    }

    const uniqueVehicle = await createUniqueVehicle(
      uniqueVehicleCreateDataFromParsed(userId, parsedBody.gameId, parsedBody)
    );

    return NextResponse.json({ id: uniqueVehicle.id }, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/unique-vehicles",
      message: "Error creating unique vehicle",
      error,
    });
    return errorResponse(
      "Error creating unique vehicle",
      500,
      serializeError(error)
    );
  }
});
