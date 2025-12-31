import { getCharacter, updateCharacter } from "@/app/lib/prisma/character";
import { AuthNextRequest } from "@/app/lib/types/api";
import { generalInformationSchema } from "@/app/lib/types/character";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { errorResponse } from "../../../shared/responses";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/general-info",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/general-info",
        message: "Invalid character ID",
        characterId: id,
      });
      return errorResponse("Invalid character ID", 400);
    }
    if (!characterBelongsToUser(id, request.auth.user.id)) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/general-info",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters.", 403);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } = generalInformationSchema
      .partial()
      .safeParse(requestBody);
    if (error) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/general-info",
        message: "Error parsing general information update request",
        details: error,
      });
      return errorResponse(
        "Error parsing general information update request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }
    const existingCharacter = await getCharacter(id);
    if (!existingCharacter) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/general-info",
        message: "Character not found",
        characterId: id,
      });
      return errorResponse("Character not found", 404);
    }
    const newGeneralInformation = {
      ...existingCharacter.generalInformation,
      ...parsedBody,
    };

    const updatedCharacter = await updateCharacter(id, {
      generalInformation: newGeneralInformation,
    });

    return NextResponse.json(updatedCharacter, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/characters/[id]/general-info",
      message: "Error updating general information",
      error,
    });
    return errorResponse(
      "Error updating general information",
      500,
      JSON.stringify(error)
    );
  }
});
