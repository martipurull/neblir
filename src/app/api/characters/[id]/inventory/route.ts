import {
  createItemCharacter,
  getCharacterInventory,
} from "@/app/lib/prisma/itemCharacter";
import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import logger from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";
import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/characters/[id]/inventory",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "GET",
        route: "/api/characters/[id]/inventory",
        message: "Invalid character ID",
        characterId: id,
      });
      return errorResponse("Invalid character ID", 400);
    }
    if (!(await characterBelongsToUser(id, request.auth.user.id))) {
      logger.error({
        method: "GET",
        route: "/api/characters/[id]/inventory",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters.", 403);
    }

    const inventory = await getCharacterInventory(id);
    return NextResponse.json(inventory);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/characters/[id]/inventory",
      message: "Error retrieving inventory",
      error,
    });
    return errorResponse(
      "Error retrieving inventory",
      500,
      serializeError(error)
    );
  }
});

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/inventory",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    if (!id || typeof id !== "string") {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/inventory",
        message: "Invalid character ID",
        characterId: id,
      });
      return errorResponse("Invalid character ID", 400);
    }
    if (!(await characterBelongsToUser(id, request.auth.user.id))) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/inventory",
        message: "Character does not belong to user",
        characterId: id,
      });
      return errorResponse("This is not one of your characters.", 403);
    }

    const requestBody = await request.json();
    const { data, error } = z
      .object({ itemId: z.string() })
      .safeParse(requestBody);
    if (error) {
      logger.error({
        method: "POST",
        route: "/api/characters/[id]/inventory",
        message: "Error parsing inventory request",
        details: error,
      });
      return errorResponse(
        "Error parsing inventory request",
        400,
        error.issues.map((issue) => issue.message).join(". ")
      );
    }

    await createItemCharacter({
      characterId: id,
      itemId: data.itemId,
    });

    return NextResponse.json("Item added to inventory", { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/characters/[id]/inventory",
      message: "Error adding item to inventory",
      error,
    });
    return errorResponse(
      "Error adding item to inventory",
      500,
      serializeError(error)
    );
  }
});
