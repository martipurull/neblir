import { pickDefinedTrackStats } from "@/app/lib/botTracks";
import {
  createCustomBot,
  getCustomBotsByGame,
} from "@/app/lib/prisma/customBot";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import {
  customBotCreateBodySchema,
  type CustomBotCreate,
} from "@/app/lib/types/bot";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

function blankToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
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

    const bots = await getCustomBotsByGame(gameId);
    return NextResponse.json(bots);
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/games/[gameId]/custom-bots",
      message: "Error fetching custom bots",
      error,
    });
    return errorResponse(
      "Error fetching custom bots",
      500,
      serializeError(error)
    );
  }
});

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user) {
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
    if (game.gameMaster !== request.auth.user.id) {
      return errorResponse(
        "Only the game master can create custom bots for this game.",
        403
      );
    }

    const parsed = customBotCreateBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(
        "Error parsing custom bot creation request",
        400,
        parsed.error.issues.map((issue) => issue.message).join(". ")
      );
    }

    const createData: CustomBotCreate = {
      gameId,
      name: parsed.data.name,
      description: blankToNull(parsed.data.description),
      confCost: parsed.data.confCost ?? null,
      usage: blankToNull(parsed.data.usage),
      notes: blankToNull(parsed.data.notes),
      maxHp: parsed.data.maxHp,
      membersCanModify: parsed.data.membersCanModify,
      maxCargoWeightKg: parsed.data.maxCargoWeightKg ?? null,
      maxInstalledItems: parsed.data.maxInstalledItems ?? null,
      speed: parsed.data.speed ?? 0,
      maxCarryWeight: parsed.data.maxCarryWeight ?? 0,
      heightMetres: parsed.data.heightMetres ?? null,
      weight: parsed.data.weight ?? null,
      ...pickDefinedTrackStats(parsed.data),
      ...(parsed.data.actions !== undefined
        ? { actions: parsed.data.actions }
        : {}),
      ...(parsed.data.additionalActions !== undefined
        ? { additionalActions: parsed.data.additionalActions }
        : {}),
    };
    const bot = await createCustomBot(createData);
    return NextResponse.json(bot, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/games/[gameId]/custom-bots",
      message: "Error creating custom bot",
      error,
    });
    return errorResponse(
      "Error creating custom bot",
      500,
      serializeError(error)
    );
  }
});
