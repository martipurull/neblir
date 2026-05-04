import { deleteGameImage, getGameImageById } from "@/app/lib/prisma/gameImage";
import { getGame } from "@/app/lib/prisma/game";
import { getR2Config, isDeletableUploadKey } from "@/app/lib/r2";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import logger from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) return errorResponse("Unauthorised", 401);
    const userId = request.auth.user.id;
    const { id, imageId } = (await params) as { id: string; imageId: string };

    const game = await getGame(id);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== userId) {
      return errorResponse("Only the game master can delete images", 403);
    }

    const image = await getGameImageById(imageId);
    if (image?.gameId !== id) return errorResponse("Image not found", 404);

    const config = getR2Config();
    if (config && isDeletableUploadKey(image.imageKey)) {
      await config.s3Client.send(
        new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: image.imageKey,
        })
      );
    }

    await deleteGameImage(imageId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "DELETE",
      route: "/api/games/[id]/images/[imageId]",
      message: "Error deleting image",
      error,
      details,
    });
    return errorResponse("Error deleting image", 500, details);
  }
});
