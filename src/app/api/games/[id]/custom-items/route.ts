import {
  createCustomItem,
  getCustomItemsByGame,
} from "@/app/lib/prisma/customItem";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import {
  customItemCreateSchema,
  type CustomItemCreate,
} from "@/app/lib/types/item";
import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import logger from "@/logger";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

const customItemCreateBodySchema = customItemCreateSchema.omit({
  gameId: true,
});

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/games/[gameId]/custom-items",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
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

    const items = await getCustomItemsByGame(gameId);
    return NextResponse.json(items);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[gameId]/custom-items",
      message: "Error fetching custom items",
      error,
    });
    return errorResponse(
      "Error fetching custom items",
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
        route: "/api/games/[gameId]/custom-items",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const { id: gameId } = (await params) as { id: string };
    if (!gameId || typeof gameId !== "string") {
      return errorResponse("Invalid game ID", 400);
    }

    const game = await getGame(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }

    const requestBody = await request.json();
    const { data: parsedBody, error } =
      customItemCreateBodySchema.safeParse(requestBody);
    if (error) {
      logger.error({
        method: "POST",
        route: "/api/games/[gameId]/custom-items",
        message: "Error parsing custom item creation request",
        details: error,
      });
      return errorResponse(
        "Error parsing custom item creation request",
        400,
        error.issues.map((i) => i.message).join(". ")
      );
    }

    const createData: CustomItemCreate = {
      ...parsedBody,
      gameId,
    };

    const item = await createCustomItem({
      gameId,
      name: createData.name,
      weight: createData.weight,
      type: createData.type ?? "GENERAL_ITEM",
      attackRoll: createData.attackRoll ?? [],
      attackBonus: createData.attackBonus ?? undefined,
      confCost: createData.confCost ?? undefined,
      costInfo: createData.costInfo ?? undefined,
      damage: createData.damage ?? undefined,
      description: createData.description ?? undefined,
      imageKey: createData.imageKey ?? undefined,
      notes: createData.notes ?? undefined,
      usage: createData.usage ?? undefined,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games/[gameId]/custom-items",
      message: "Error creating custom item",
      error,
    });
    return errorResponse(
      "Error creating custom item",
      500,
      serializeError(error)
    );
  }
});
