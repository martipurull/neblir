import { canReadReferenceEntry } from "@/app/lib/authz/referenceEntry";
import { getReferenceEntryAttachmentById } from "@/app/lib/prisma/referenceEntryAttachment";
import { getReferenceEntry } from "@/app/lib/prisma/referenceEntry";
import { getR2Config } from "@/app/lib/r2";
import { contentTypeFromFileName, isPdfFileName } from "@/app/lib/r2UploadKeys";
import { sanitizeAttachmentFilenamePart } from "@/app/api/shared/filename";
import {
  contentDispositionHeader,
  parseFileUrlDisposition,
} from "@/app/api/shared/fileUrlDisposition";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { errorResponse } from "../shared/responses";

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const attachmentId = request.nextUrl.searchParams.get("attachmentId");
    if (!attachmentId) {
      return errorResponse("Attachment ID is required", 400);
    }

    const attachment = await getReferenceEntryAttachmentById(attachmentId);
    if (!attachment) {
      return errorResponse("Attachment not found", 404);
    }

    const entry = await getReferenceEntry(attachment.referenceEntryId);
    if (!entry) {
      return errorResponse("Attachment not found", 404);
    }

    const canRead = await canReadReferenceEntry(entry, request.auth.user.id);
    if (!canRead) {
      return errorResponse("You cannot access this attachment", 403);
    }

    const config = getR2Config();
    if (!config) {
      return errorResponse("File download is not configured", 500);
    }

    const isPdf = isPdfFileName(attachment.fileName);
    const filename = sanitizeAttachmentFilenamePart(
      attachment.fileName,
      isPdf ? "file.pdf" : "image.png"
    );
    const disposition = parseFileUrlDisposition(
      request.nextUrl.searchParams.get("disposition")
    );
    const signedUrl = await getSignedUrl(
      config.s3Client,
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: attachment.fileKey,
        ResponseContentDisposition: contentDispositionHeader(
          disposition,
          filename
        ),
        ResponseContentType: contentTypeFromFileName(attachment.fileName),
      }),
      { expiresIn: 3600 }
    );

    return NextResponse.json({ url: signedUrl }, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/lore-attachment-url",
      message: "Error generating lore attachment URL",
      error,
    });
    return errorResponse("Error fetching lore attachment URL", 500);
  }
});
