import { updateCharacter } from "@/app/lib/prisma/character";
import { NextResponse } from "next/server";
import { characterNotesSchema } from "@/app/lib/types/character";
import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { characterBelongsToUser } from "../../checks";
import logger from "@/logger";
import { errorResponse } from "../../../shared/responses";

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/notes",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/notes",
        message: "Invalid character ID",
        characterId: id,
      });
      return errorResponse("Invalid character ID", 400);
    }
    if (!characterBelongsToUser(request.auth?.user?.characters, id)) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/notes",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters.", 403);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      characterNotesSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/notes",
        message: "Error parsing notes update request",
        details: error,
      });
      return errorResponse("Error parsing notes update request", 400, error.issues.map((issue) => issue.message).join(". "));
    }

    const updatedCharacter = await updateCharacter(id, { notes: parsedBody });

    return NextResponse.json(updatedCharacter, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/characters/[id]/notes",
      message: "Error updating notes",
      error,
    });
    return errorResponse("Error updating notes", 500, JSON.stringify(error));
  }
});
