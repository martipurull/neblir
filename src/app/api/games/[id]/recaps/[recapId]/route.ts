import { deleteGameRecap, getGameRecapById } from "@/app/lib/prisma/gameRecap";
import { getGame } from "@/app/lib/prisma/game";
import { getR2Config, isDeletableUploadKey } from "@/app/lib/r2";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import logger from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

const route = "/api/games/[id]/recaps/[recapId]";

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    const { id, recapId } = (await params) as { id: string; recapId: string };

    const game = await getGame(id);
    if (!game) {
      return errorResponse("Game not found", 404);
    }
    if (game.gameMaster !== userId) {
      return errorResponse("Only the game master can delete recaps", 403);
    }

    const recap = await getGameRecapById(recapId);
    if (!recap || recap?.gameId !== id) {
      return errorResponse("Recap not found", 404);
    }

    const config = getR2Config();
    if (config && isDeletableUploadKey(recap.fileKey)) {
      await config.s3Client.send(
        new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: recap.fileKey,
        })
      );
    }

    await deleteGameRecap(recapId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "DELETE",
      route,
      message: "Error deleting recap",
      error,
      details,
    });
    return errorResponse("Error deleting recap", 500, details);
  }
});
