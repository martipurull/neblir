import {
  deleteGameFile,
  getGameFileById,
  updateGameFile,
} from "@/app/lib/prisma/gameFile";
import { getGame } from "@/app/lib/prisma/game";
import { getR2Config, isDeletableUploadKey } from "@/app/lib/r2";
import {
  isImageFileName,
  isPdfFileName,
  isValidGameFileKey,
} from "@/app/lib/r2UploadKeys";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { gameFileUpdateSchema } from "@/app/lib/types/gameFile";
import { auth } from "@/auth";
import { DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

const route = "/api/games/[id]/files/[fileId]";

export const PATCH = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    const { id, fileId } = (await params) as { id: string; fileId: string };

    const game = await getGame(id);
    if (!game) {
      return errorResponse("Game not found", 404);
    }
    if (game.gameMaster !== userId) {
      return errorResponse("Only the game master can edit files", 403);
    }

    const file = await getGameFileById(fileId);
    if (file?.gameId !== id) {
      return errorResponse("File not found", 404);
    }

    const requestBody = await request.json();
    const parsed = gameFileUpdateSchema.safeParse(requestBody);
    if (!parsed.success) {
      const validationDetails = parsed.error.issues
        .map((issue) => {
          const field = issue.path.join(".") || "body";
          return `${field}: ${issue.message}`;
        })
        .join(". ");
      return errorResponse(
        `Invalid file data. ${validationDetails}`,
        400,
        validationDetails
      );
    }

    const replacementFile =
      parsed.data.kind != null &&
      parsed.data.fileKey != null &&
      parsed.data.fileName != null &&
      parsed.data.fileSizeBytes != null
        ? {
            kind: parsed.data.kind,
            fileKey: parsed.data.fileKey,
            fileName: parsed.data.fileName,
            fileSizeBytes: parsed.data.fileSizeBytes,
          }
        : null;

    if (replacementFile) {
      if (!isValidGameFileKey(replacementFile.fileKey, replacementFile.kind)) {
        return errorResponse("Invalid file key for the selected kind", 400);
      }
      if (
        replacementFile.kind === "PDF" &&
        !isPdfFileName(replacementFile.fileName)
      ) {
        return errorResponse("PDF file name must end with .pdf", 400);
      }
      if (
        replacementFile.kind === "IMAGE" &&
        !isImageFileName(replacementFile.fileName)
      ) {
        return errorResponse(
          "Image file name must end with .jpg, .jpeg, .png, .gif, or .webp",
          400
        );
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
        return errorResponse("Uploaded file not found in storage", 400);
      }
    }

    const previousFileKey = file.fileKey;
    const updated = await updateGameFile(fileId, {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      access: parsed.data.access,
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
            message: "Failed to delete previous game file after replace",
            error,
            details: serializeError(error),
            previousFileKey,
            fileId,
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
      message: "Error updating file",
      error,
      details,
    });
    return errorResponse("Error updating file", 500, details);
  }
});

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) return errorResponse("Unauthorised", 401);
    const userId = request.auth.user.id;
    const { id, fileId } = (await params) as { id: string; fileId: string };

    const game = await getGame(id);
    if (!game) return errorResponse("Game not found", 404);
    if (game.gameMaster !== userId) {
      return errorResponse("Only the game master can delete files", 403);
    }

    const file = await getGameFileById(fileId);
    if (file?.gameId !== id) return errorResponse("File not found", 404);

    const config = getR2Config();
    if (config && isDeletableUploadKey(file.fileKey)) {
      await config.s3Client.send(
        new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: file.fileKey,
        })
      );
    }

    await deleteGameFile(fileId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "DELETE",
      route,
      message: "Error deleting file",
      error,
      details,
    });
    return errorResponse("Error deleting file", 500, details);
  }
});
