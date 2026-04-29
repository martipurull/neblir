import { createGameRecap, getGameRecaps } from "@/app/lib/prisma/gameRecap";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { gameRecapCreateSchema } from "@/app/lib/types/recap";
import { auth } from "@/auth";
import logger from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

const route = "/api/games/[id]/recaps";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    const { id } = (await params) as { id: string };

    const inGame = await userIsInGame(id, userId);
    if (!inGame) {
      return errorResponse("You are not part of this game", 403);
    }

    const recaps = await getGameRecaps(id);
    return NextResponse.json(recaps, { status: 200 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "GET",
      route,
      message: "Error fetching recaps",
      error,
      details,
    });
    return errorResponse("Error fetching recaps", 500, details);
  }
});

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    const { id } = (await params) as { id: string };
    const game = await getGame(id);
    if (!game) {
      return errorResponse("Game not found", 404);
    }
    if (game.gameMaster !== userId) {
      return errorResponse("Only the game master can upload recaps", 403);
    }

    const requestBody = await request.json();
    const parsed = gameRecapCreateSchema.safeParse(requestBody);
    if (!parsed.success) {
      const validationDetails = parsed.error.issues
        .map((issue) => {
          const field = issue.path.join(".") || "body";
          return `${field}: ${issue.message}`;
        })
        .join(". ");
      return errorResponse(
        `Invalid recap data. ${validationDetails}`,
        400,
        validationDetails
      );
    }

    const recap = await createGameRecap({
      gameId: id,
      title: parsed.data.title,
      summary: parsed.data.summary ?? null,
      fileKey: parsed.data.fileKey,
      fileName: parsed.data.fileName,
      fileSizeBytes: parsed.data.fileSizeBytes,
      uploadedByUserId: userId,
    });
    return NextResponse.json(recap, { status: 201 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "POST",
      route,
      message: "Error creating recap",
      error,
      details,
    });
    return errorResponse("Error creating recap", 500, details);
  }
});
