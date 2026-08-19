import { canReadGameFile } from "@/app/lib/authz/gameFile";
import { getGameFileById } from "@/app/lib/prisma/gameFile";
import { getR2Config } from "@/app/lib/r2";
import { imageContentTypeFromFileName } from "@/app/lib/r2UploadKeys";
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

    const fileId = request.nextUrl.searchParams.get("fileId");
    if (!fileId) {
      return errorResponse("File ID is required", 400);
    }

    const file = await getGameFileById(fileId);
    if (!file) {
      return errorResponse("File not found", 404);
    }

    const canRead = await canReadGameFile(file, request.auth.user.id);
    if (!canRead) {
      return errorResponse("You cannot access this file", 403);
    }

    const config = getR2Config();
    if (!config) {
      return errorResponse("File download is not configured", 500);
    }

    const isPdf = file.kind === "PDF";
    const fallbackName = isPdf ? "file.pdf" : "image.png";
    const filename = sanitizeAttachmentFilenamePart(
      file.fileName,
      fallbackName
    );
    const disposition = parseFileUrlDisposition(
      request.nextUrl.searchParams.get("disposition")
    );
    const signedUrl = await getSignedUrl(
      config.s3Client,
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: file.fileKey,
        ResponseContentDisposition: contentDispositionHeader(
          disposition,
          filename
        ),
        ResponseContentType: isPdf
          ? "application/pdf"
          : imageContentTypeFromFileName(file.fileName),
      }),
      { expiresIn: 3600 }
    );

    return NextResponse.json({ url: signedUrl }, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/game-file-url",
      message: "Error generating game file URL",
      error,
    });
    return errorResponse("Error fetching game file URL", 500);
  }
});
