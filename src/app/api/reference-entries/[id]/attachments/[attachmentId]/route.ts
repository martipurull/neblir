import { canWriteGameScopedReferenceEntry } from "@/app/lib/authz/referenceEntry";
import { getReferenceEntry } from "@/app/lib/prisma/referenceEntry";
import {
  deleteReferenceEntryAttachment,
  getReferenceEntryAttachmentById,
} from "@/app/lib/prisma/referenceEntryAttachment";
import { getR2Config, isDeletableUploadKey } from "@/app/lib/r2";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { serializeError } from "../../../../shared/errors";
import { errorResponse } from "../../../../shared/responses";

const route = "/api/reference-entries/[id]/attachments/[attachmentId]";

export const DELETE = auth(async (request: AuthNextRequest, { params }) => {
  try {
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const userId = request.auth.user.id;
    const { id, attachmentId } = (await params) as {
      id: string;
      attachmentId: string;
    };

    const entry = await getReferenceEntry(id);
    if (!entry) {
      return errorResponse("Reference entry not found", 404);
    }

    const canWrite = await canWriteGameScopedReferenceEntry(entry, userId);
    if (!canWrite) {
      return errorResponse(
        "Only the game master can delete lore attachments",
        403
      );
    }

    const attachment = await getReferenceEntryAttachmentById(attachmentId);
    if (attachment?.referenceEntryId !== id) {
      return errorResponse("Attachment not found", 404);
    }

    const config = getR2Config();
    if (config && isDeletableUploadKey(attachment.fileKey)) {
      await config.s3Client.send(
        new DeleteObjectCommand({
          Bucket: config.bucketName,
          Key: attachment.fileKey,
        })
      );
    }

    await deleteReferenceEntryAttachment(attachmentId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const details = serializeError(error);
    logger.error({
      method: "DELETE",
      route,
      message: "Error deleting lore attachment",
      error,
      details,
    });
    return errorResponse("Error deleting lore attachment", 500, details);
  }
});
