import {
  canReadReferenceEntry,
  canWriteGameScopedReferenceEntry,
} from "@/app/lib/authz/referenceEntry";
import { getReferenceEntry } from "@/app/lib/prisma/referenceEntry";
import {
  createReferenceEntryAttachment,
  getReferenceEntryAttachments,
} from "@/app/lib/prisma/referenceEntryAttachment";
import { getR2Config } from "@/app/lib/r2";
import {
  isValidLoreAttachmentFileKey,
  loreAttachmentKindFromFileName,
} from "@/app/lib/r2UploadKeys";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { referenceEntryAttachmentCreateSchema } from "@/app/lib/types/referenceEntryAttachment";
import { auth } from "@/auth";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../shared/errors";
import { errorResponse } from "../../../shared/responses";

const route = "/api/reference-entries/[id]/attachments";

export const GET = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const { id } = (await params) as { id: string };
    const entry = await getReferenceEntry(id);
    if (!entry) {
      return errorResponse("Reference entry not found", 404);
    }

    const canRead = await canReadReferenceEntry(entry, request.auth.user.id);
    if (!canRead) {
      return errorResponse("You cannot access this reference entry", 403);
    }

    const attachments = await getReferenceEntryAttachments(id);
    return NextResponse.json(attachments, { status: 200 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "GET",
      route,
      message: "Error fetching lore attachments",
      error,
      details,
    });
    return errorResponse("Error fetching lore attachments", 500, details);
  }
});

export const POST = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    const { id } = (await params) as { id: string };
    const entry = await getReferenceEntry(id);
    if (!entry) {
      return errorResponse("Reference entry not found", 404);
    }
    if (entry.category !== "CAMPAIGN_LORE" || !entry.gameId) {
      return errorResponse(
        "Attachments can only be added to campaign lore entries",
        400
      );
    }

    const canWrite = await canWriteGameScopedReferenceEntry(entry, userId);
    if (!canWrite) {
      return errorResponse(
        "Only the game master can upload lore attachments",
        403
      );
    }

    const requestBody = await request.json();
    const parsed = referenceEntryAttachmentCreateSchema.safeParse(requestBody);
    if (!parsed.success) {
      const validationDetails = parsed.error.issues
        .map((issue) => {
          const field = issue.path.join(".") || "body";
          return `${field}: ${issue.message}`;
        })
        .join(". ");
      return errorResponse(
        `Invalid attachment data. ${validationDetails}`,
        400,
        validationDetails
      );
    }

    const kind = loreAttachmentKindFromFileName(parsed.data.fileName);
    if (!kind) {
      return errorResponse("Attachment file name must be an image or PDF", 400);
    }
    if (!isValidLoreAttachmentFileKey(parsed.data.fileKey, kind)) {
      return errorResponse("Invalid lore attachment file key", 400);
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
      return errorResponse(
        "Uploaded attachment file not found in storage",
        400
      );
    }

    const attachment = await createReferenceEntryAttachment({
      referenceEntryId: id,
      fileKey: parsed.data.fileKey,
      fileName: parsed.data.fileName,
      fileSizeBytes: parsed.data.fileSizeBytes,
      uploadedByUserId: userId,
    });
    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "POST",
      route,
      message: "Error creating lore attachment",
      error,
      details,
    });
    return errorResponse("Error creating lore attachment", 500, details);
  }
});
