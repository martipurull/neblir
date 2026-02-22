import {
  deleteCustomItem,
  getCustomItem,
  updateCustomItem,
} from "@/app/lib/prisma/customItem";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import { customItemUpdateSchema } from "@/app/lib/types/item";
import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import logger from "@/logger";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id: gameId, customItemId } = (await params) as {
      id: string;
      customItemId: string;
    };
    if (!gameId || !customItemId) {
      return errorResponse("Invalid game or custom item ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }

    const isGameMaster = game.gameMaster === request.auth.user.id;
    const isInGame = await userIsInGame(gameId, request.auth.user.id);
    if (!isGameMaster && !isInGame) {
      return errorResponse("You do not have access to this game.", 403);
    }

    const item = await getCustomItem(customItemId);
    if (!item || item.gameId !== gameId) {
      return errorResponse("Custom item not found", 404);
    }

    return NextResponse.json(item);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[id]/custom-items/[customItemId]",
      message: "Error fetching custom item",
      error,
    });
    return errorResponse(
      "Error fetching custom item",
      500,
      serializeError(error)
    );
  }
});

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id: gameId, customItemId } = (await params) as {
      id: string;
      customItemId: string;
    };
    if (!gameId || !customItemId) {
      return errorResponse("Invalid game or custom item ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }

    const existing = await getCustomItem(customItemId);
    if (!existing || existing.gameId !== gameId) {
      return errorResponse("Custom item not found", 404);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      customItemUpdateSchema.safeParse(requestBody);
    if (error) {
      return errorResponse(
        "Error parsing custom item update request",
        400,
        error.issues.map((i) => i.message).join(". ")
      );
    }

    const updated = await updateCustomItem(customItemId, parsedBody);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(
        "Validation error updating custom item",
        400,
        error.issues.map((i) => `${i.path}: ${i.message}`).join(". ")
      );
    }
    logger.error({
      method: "PATCH",
      route: "/api/games/[id]/custom-items/[customItemId]",
      message: "Error updating custom item",
      error,
    });
    return errorResponse(
      "Error updating custom item",
      500,
      serializeError(error)
    );
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const { id: gameId, customItemId } = (await params) as {
      id: string;
      customItemId: string;
    };
    if (!gameId || !customItemId) {
      return errorResponse("Invalid game or custom item ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }

    const existing = await getCustomItem(customItemId);
    if (!existing || existing.gameId !== gameId) {
      return errorResponse("Custom item not found", 404);
    }

    await deleteCustomItem(customItemId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/games/[id]/custom-items/[customItemId]",
      message: "Error deleting custom item",
      error,
    });
    return errorResponse(
      "Error deleting custom item",
      500,
      serializeError(error)
    );
  }
});
