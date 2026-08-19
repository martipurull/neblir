import {
  IMAGE_MAX_SIZE_BYTES,
  IMAGE_MAX_SIZE_LABEL,
  PDF_MAX_SIZE_BYTES,
  PDF_MAX_SIZE_LABEL,
} from "@/app/lib/constants/uploadLimits";
import { getGame } from "@/app/lib/prisma/game";
import { getReferenceEntry } from "@/app/lib/prisma/referenceEntry";
import { getR2Config } from "@/app/lib/r2";
import {
  buildUploadKey,
  contentTypeFromFileName,
  loreAttachmentKindFromFileName,
} from "@/app/lib/r2UploadKeys";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { loreAttachmentUploadUrlRequestSchema } from "@/app/lib/types/referenceEntryAttachment";
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
    const parsed = loreAttachmentUploadUrlRequestSchema.safeParse(requestBody);
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

    const { fileName, fileSizeBytes } = parsed.data;
    let gameId = parsed.data.gameId ?? null;

    if (parsed.data.referenceEntryId) {
      const entry = await getReferenceEntry(parsed.data.referenceEntryId);
      if (!entry) {
        return errorResponse("Reference entry not found", 404);
      }
      if (entry.category !== "CAMPAIGN_LORE" || !entry.gameId) {
        return errorResponse(
          "Attachments can only be added to campaign lore entries",
          400
        );
      }
      if (gameId && gameId !== entry.gameId) {
        return errorResponse("Game does not match this lore entry", 400);
      }
      gameId = entry.gameId;
    }

    if (!gameId) {
      return errorResponse("Game not found", 404);
    }

    const game = await getGame(gameId);
    if (!game) {
      return errorResponse("Game not found", 404);
    }
    if (game.gameMaster !== userId) {
      return errorResponse(
        "Only the game master can upload lore attachments",
        403
      );
    }

    const kind = loreAttachmentKindFromFileName(fileName);
    if (!kind) {
      return errorResponse(
        "Lore attachments only support images (PNG, JPEG, GIF, WebP) and PDF files",
        400
      );
    }
    if (kind === "PDF" && fileSizeBytes > PDF_MAX_SIZE_BYTES) {
      return errorResponse(`PDF must be ${PDF_MAX_SIZE_LABEL} or smaller`, 400);
    }
    if (kind === "IMAGE" && fileSizeBytes > IMAGE_MAX_SIZE_BYTES) {
      return errorResponse(
        `Image must be ${IMAGE_MAX_SIZE_LABEL} or smaller`,
        400
      );
    }

    const config = getR2Config();
    if (!config) {
      logger.error({
        method: "POST",
        route: "/api/lore-attachment-upload-url",
        message: "R2 credentials missing",
      });
      return errorResponse("File upload is not configured", 500);
    }

    const fileKey = buildUploadKey("lore", fileName);
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
      route: "/api/lore-attachment-upload-url",
      message: "Error creating lore attachment upload URL",
      error,
    });
    return errorResponse("Failed to create lore attachment upload URL", 500);
  }
});
