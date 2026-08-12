import {
  deleteGameRecap,
  getGameRecapById,
  updateGameRecap,
} from "@/app/lib/prisma/gameRecap";
import { getGame } from "@/app/lib/prisma/game";
import { getR2Config, isDeletableUploadKey } from "@/app/lib/r2";
import { isPdfFileName, isValidRecapFileKey } from "@/app/lib/r2UploadKeys";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { gameRecapUpdateSchema } from "@/app/lib/types/recap";
import { auth } from "@/auth";
import { DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

const route = "/api/games/[id]/recaps/[recapId]";

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
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
      return errorResponse("Only the game master can edit recaps", 403);
    }

    const recap = await getGameRecapById(recapId);
    if (recap?.gameId !== id) {
      return errorResponse("Recap not found", 404);
    }

    const requestBody = await request.json();
    const parsed = gameRecapUpdateSchema.safeParse(requestBody);
    if (!parsed.success) {
      const validationDetails = parsed.error.issues
        .map((issue) => {
          const field = issue.path.join(".") ?? "body";
          return `${field}: ${issue.message}`;
        })
        .join(". ");
      return errorResponse(
        `Invalid recap data. ${validationDetails}`,
        400,
        validationDetails
      );
    }

    const replacementFile =
      parsed.data.fileKey != null &&
      parsed.data.fileName != null &&
      parsed.data.fileSizeBytes != null
        ? {
            fileKey: parsed.data.fileKey,
            fileName: parsed.data.fileName,
            fileSizeBytes: parsed.data.fileSizeBytes,
          }
        : null;

    if (replacementFile) {
      if (!isValidRecapFileKey(replacementFile.fileKey)) {
        return errorResponse("Invalid recap file key", 400);
      }
      if (!isPdfFileName(replacementFile.fileName)) {
        return errorResponse("Recap file name must end with .pdf", 400);
      }

      const config = getR2Config();
      if (!config) {
        return errorResponse("File upload is not configured", 500);
      }

      try {
        const head = await config.s3Client.send(
          new HeadObjectCommand({
            Bucket: config.bucketName,
            Key: replacementFile.fileKey,
          })
        );
        if (head.ContentLength !== replacementFile.fileSizeBytes) {
          return errorResponse("Uploaded file size does not match", 400);
        }
      } catch {
        return errorResponse("Uploaded recap file not found in storage", 400);
      }
    }

    const previousFileKey = recap.fileKey;
    const updated = await updateGameRecap(recapId, {
      title: parsed.data.title,
      summary: parsed.data.summary ?? null,
      ...(replacementFile ?? {}),
    });

    if (replacementFile && replacementFile.fileKey !== previousFileKey) {
      const config = getR2Config();
      if (config && isDeletableUploadKey(previousFileKey)) {
        try {
          await config.s3Client.send(
            new DeleteObjectCommand({
              Bucket: config.bucketName,
              Key: previousFileKey,
            })
          );
        } catch (error) {
          logger.error({
            method: "PATCH",
            route,
            message: "Failed to delete previous recap PDF after replace",
            error,
            details: serializeError(error),
            previousFileKey,
            recapId,
          });
        }
      }
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "PATCH",
      route,
      message: "Error updating recap",
      error,
      details,
    });
    return errorResponse("Error updating recap", 500, details);
  }
});

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
