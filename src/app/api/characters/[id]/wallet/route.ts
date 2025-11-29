import { updateCharacter } from "@/app/lib/prisma/character";
import { AuthNextRequest } from "@/app/lib/types/api";
import { walletSchema } from "@/app/lib/types/item";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { characterBelongsToUser } from "../../checks";
import logger from "@/logger";
import { errorResponse } from "../../../shared/responses";

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/wallet",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/wallet",
        message: "Invalid character ID",
        characterId: id,
      });
      return errorResponse("Invalid character ID", 400);
    }
    if (!characterBelongsToUser(request.auth?.user?.characters, id)) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/wallet",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters.", 403);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } = walletSchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "PATCH",
        route: "/api/characters/[id]/wallet",
        message: "Error parsing wallet update request",
        details: error,
      });
      return errorResponse("Error parsing wallet update request", 400, error.issues.map((issue) => issue.message).join(". "));
    }

    const updatedCharacter = await updateCharacter(id, { wallet: parsedBody });

    return NextResponse.json(updatedCharacter, { status: 200 });
  } catch (error) {
    logger.error({
      method: "PATCH",
      route: "/api/characters/[id]/wallet",
      message: "Error updating wallet",
      error,
    });
    return errorResponse("Error updating wallet", 500, JSON.stringify(error));
  }
});
