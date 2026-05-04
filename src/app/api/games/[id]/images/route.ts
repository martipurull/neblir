import { createGameImage, getGameImages } from "@/app/lib/prisma/gameImage";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { gameImageCreateSchema } from "@/app/lib/types/gameImage";
import { auth } from "@/auth";
import logger from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

const route = "/api/games/[id]/images";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) return errorResponse("Unauthorised", 401);
    const userId = request.auth.user.id;
    const { id } = (await params) as { id: string };

    const inGame = await userIsInGame(id, userId);
    if (!inGame) return errorResponse("You are not part of this game", 403);

    const images = await getGameImages(id);
    return NextResponse.json(images, { status: 200 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "GET",
      route,
      message: "Error fetching images",
      error,
      details,
    });
    return errorResponse("Error fetching images", 500, details);
  }
});

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) return errorResponse("Unauthorised", 401);
    const userId = request.auth.user.id;
    const { id } = (await params) as { id: string };
    const game = await getGame(id);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== userId) {
      return errorResponse("Only the game master can upload images", 403);
    }

    const body = await request.json();
    const parsed = gameImageCreateSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
        .join(". ");
      return errorResponse(`Invalid image data. ${details}`, 400, details);
    }

    const image = await createGameImage({
      gameId: id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      imageKey: parsed.data.imageKey,
      uploadedByUserId: userId,
    });
    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "POST",
      route,
      message: "Error creating image",
      error,
      details,
    });
    return errorResponse("Error creating image", 500, details);
  }
});
