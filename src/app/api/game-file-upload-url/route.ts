import {
  DOCUMENT_IMAGE_MAX_SIZE_BYTES,
  DOCUMENT_IMAGE_MAX_SIZE_LABEL,
  PDF_MAX_SIZE_BYTES,
  PDF_MAX_SIZE_LABEL,
} from "@/app/lib/constants/uploadLimits";
import { getGame } from "@/app/lib/prisma/game";
import { getR2Config } from "@/app/lib/r2";
import {
  buildUploadKey,
  contentTypeFromFileName,
  isImageFileName,
  isPdfFileName,
} from "@/app/lib/r2UploadKeys";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { gameFileUploadUrlRequestSchema } from "@/app/lib/types/gameFile";
import { auth } from "@/auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { errorResponse } from "../shared/responses";

const PRESIGNED_UPLOAD_EXPIRES_SECONDS = 15 * 60;

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    const requestBody = await request.json();
    const parsed = gameFileUploadUrlRequestSchema.safeParse(requestBody);
    if (!parsed.success) {
      const validationDetails = parsed.error.issues
        .map((issue) => {
          const field = issue.path.join(".") || "body";
          return `${field}: ${issue.message}`;
        })
        .join(". ");
      return errorResponse(
        `Invalid upload request. ${validationDetails}`,
        400,
        validationDetails
      );
    }

    const { gameId, fileName, fileSizeBytes, kind } = parsed.data;

    const game = await getGame(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }
    if (game.gameMaster !== userId) {
      return errorResponse("Only the game master can upload files", 403);
    }

    const kindFromName = isPdfFileName(fileName)
      ? "PDF"
      : isImageFileName(fileName)
        ? "IMAGE"
        : null;
    if (!kindFromName || kindFromName !== kind) {
      return errorResponse(
        "Game files only support images (PNG, JPEG, GIF, WebP) and PDF files",
        400
      );
    }
    if (kind === "PDF" && fileSizeBytes > PDF_MAX_SIZE_BYTES) {
      return errorResponse(
        `File must be ${PDF_MAX_SIZE_LABEL} or smaller`,
        400
      );
    }
    if (kind === "IMAGE" && fileSizeBytes > DOCUMENT_IMAGE_MAX_SIZE_BYTES) {
      return errorResponse(
        `Image must be ${DOCUMENT_IMAGE_MAX_SIZE_LABEL} or smaller`,
        400
      );
    }

    const config = getR2Config();
    if (!config) {
      logger.error({
        method: "POST",
        route: "/api/game-file-upload-url",
        message: "R2 credentials missing",
      });
      return errorResponse("File upload is not configured", 500);
    }

    const fileKey = buildUploadKey("files", fileName);
    const uploadUrl = await getSignedUrl(
      config.s3Client,
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: fileKey,
        ContentType: contentTypeFromFileName(fileName),
      }),
      { expiresIn: PRESIGNED_UPLOAD_EXPIRES_SECONDS }
    );

    return NextResponse.json({ fileKey, uploadUrl }, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/game-file-upload-url",
      message: "Error creating game file upload URL",
      error,
    });
    return errorResponse("Failed to create game file upload URL", 500);
  }
});
