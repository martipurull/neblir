import { createGameFile, getGameFiles } from "@/app/lib/prisma/gameFile";
import { getGame, userIsInGame } from "@/app/lib/prisma/game";
import { getR2Config } from "@/app/lib/r2";
import {
  isImageFileName,
  isPdfFileName,
  isValidGameFileKey,
} from "@/app/lib/r2UploadKeys";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { gameFileCreateSchema } from "@/app/lib/types/gameFile";
import { auth } from "@/auth";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

const route = "/api/games/[id]/files";

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

    const files = await getGameFiles(id);
    return NextResponse.json(files, { status: 200 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "GET",
      route,
      message: "Error fetching files",
      error,
      details,
    });
    return errorResponse("Error fetching files", 500, details);
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
      return errorResponse("Only the game master can upload files", 403);
    }

    const requestBody = await request.json();
    const parsed = gameFileCreateSchema.safeParse(requestBody);
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

    if (!isValidGameFileKey(parsed.data.fileKey, parsed.data.kind)) {
      return errorResponse("Invalid file key for the selected kind", 400);
    }
    if (parsed.data.kind === "PDF" && !isPdfFileName(parsed.data.fileName)) {
      return errorResponse("PDF file name must end with .pdf", 400);
    }
    if (
      parsed.data.kind === "IMAGE" &&
      !isImageFileName(parsed.data.fileName)
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
          Key: parsed.data.fileKey,
        })
      );
      if (head.ContentLength !== parsed.data.fileSizeBytes) {
        return errorResponse("Uploaded file size does not match", 400);
      }
    } catch {
      return errorResponse("Uploaded file not found in storage", 400);
    }

    const file = await createGameFile({
      gameId: id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      kind: parsed.data.kind,
      fileKey: parsed.data.fileKey,
      fileName: parsed.data.fileName,
      fileSizeBytes: parsed.data.fileSizeBytes,
      uploadedByUserId: userId,
    });
    return NextResponse.json(file, { status: 201 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "POST",
      route,
      message: "Error creating file",
      error,
      details,
    });
    return errorResponse("Error creating file", 500, details);
  }
});
