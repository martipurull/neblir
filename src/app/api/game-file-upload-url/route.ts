import {
  PDF_MAX_SIZE_BYTES,
  PDF_MAX_SIZE_LABEL,
} from "@/app/lib/constants/uploadLimits";
import { getGame } from "@/app/lib/prisma/game";
import { getR2Config } from "@/app/lib/r2";
import { buildUploadKey, isPdfFileName } from "@/app/lib/r2UploadKeys";
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

    const { gameId, fileName, fileSizeBytes } = parsed.data;

    const game = await getGame(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }
    if (game.gameMaster !== userId) {
      return errorResponse("Only the game master can upload files", 403);
    }

    if (!isPdfFileName(fileName)) {
      return errorResponse("PDF upload only supports PDF files", 400);
    }
    if (fileSizeBytes > PDF_MAX_SIZE_BYTES) {
      return errorResponse(
        `File must be ${PDF_MAX_SIZE_LABEL} or smaller`,
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
        ContentType: "application/pdf",
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
