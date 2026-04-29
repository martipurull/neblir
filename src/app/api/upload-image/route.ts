import { getR2Config, isDeletableUploadKey } from "@/app/lib/r2";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import logger from "@/logger";
import { NextResponse } from "next/server";
import { errorResponse } from "../shared/responses";

const ALLOWED_TYPES = [
  "custom_items",
  "unique_items",
  "games",
  "characters",
  "recaps",
] as const;
const IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const RECAP_MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const ALLOWED_RECAP_EXTENSIONS = ["pdf"];

function getExtension(filename: string): string {
  const last = filename.split(".").pop()?.toLowerCase();
  return last && ALLOWED_EXTENSIONS.includes(last) ? last : "png";
}

function getRecapExtension(filename: string): string {
  const last = filename.split(".").pop()?.toLowerCase();
  return last && ALLOWED_RECAP_EXTENSIONS.includes(last) ? last : "pdf";
}

/** Coerce original filename to pattern: lowercase, spaces → underscores, only [a-z0-9_]. */
function sanitizeFilenameBasename(originalName: string): string {
  const withoutExt = originalName.replace(/\.[^.]+$/, "").trim() || "image";
  const lower = withoutExt.toLowerCase();
  const withUnderscores = lower.replace(/\s+/g, "_");
  const sanitized = withUnderscores
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return sanitized || "image";
}

function shortId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Build key: {type}-{sanitized_basename}-{shortId}.{ext} e.g. custom_items-super_special_gun_930840ndf-abc12.png */
function buildKey(
  type: (typeof ALLOWED_TYPES)[number],
  originalFilename: string
): string {
  const ext =
    type === "recaps"
      ? getRecapExtension(originalFilename)
      : getExtension(originalFilename);
  const base = sanitizeFilenameBasename(originalFilename);
  return `${type}-${base}-${shortId()}.${ext}`;
}

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const type = request.nextUrl.searchParams.get("type");
    if (
      !type ||
      !ALLOWED_TYPES.includes(type as (typeof ALLOWED_TYPES)[number])
    ) {
      return errorResponse(
        "Query param 'type' must be one of: custom_items, unique_items, games, characters, recaps",
        400
      );
    }

    const config = getR2Config();
    if (!config) {
      logger.error({
        method: "POST",
        route: "/api/upload-image",
        message: "R2 credentials missing",
      });
      return errorResponse("File upload is not configured", 500);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob) || !("name" in file)) {
      return errorResponse("Missing or invalid file", 400);
    }

    const blob = file as Blob & { name: string };
    const isRecap = type === "recaps";
    const maxSize = isRecap ? RECAP_MAX_SIZE_BYTES : IMAGE_MAX_SIZE_BYTES;
    if (blob.size > maxSize) {
      return errorResponse(
        isRecap
          ? "File must be 20MB or smaller"
          : "File must be 5MB or smaller",
        400
      );
    }

    if (isRecap) {
      const extension = getRecapExtension(blob.name);
      const isPdfMime = blob.type === "application/pdf";
      if (extension !== "pdf" || !isPdfMime) {
        return errorResponse("Recap upload only supports PDF files", 400);
      }
    }

    const key = buildKey(type as (typeof ALLOWED_TYPES)[number], blob.name);
    const ext = isRecap
      ? getRecapExtension(blob.name)
      : getExtension(blob.name);

    const buffer = Buffer.from(await blob.arrayBuffer());

    await config.s3Client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: isRecap ? "application/pdf" : blob.type || `image/${ext}`,
      })
    );

    return NextResponse.json({ fileKey: key }, { status: 201 });
  } catch (error) {
    logger.error({
      method: "POST",
      route: "/api/upload-image",
      message: "Error uploading image",
      error,
    });
    return errorResponse("Failed to upload image", 500);
  }
});

export const DELETE = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const fileKey = request.nextUrl.searchParams.get("fileKey");
    if (!fileKey) {
      return errorResponse("Query param 'fileKey' is required", 400);
    }

    if (!isDeletableUploadKey(fileKey)) {
      return errorResponse("Not allowed to delete this file", 403);
    }

    const config = getR2Config();
    if (!config) {
      logger.error({
        method: "DELETE",
        route: "/api/upload-image",
        message: "R2 credentials missing",
      });
      return errorResponse("File delete is not configured", 500);
    }

    await config.s3Client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: fileKey,
      })
    );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error({
      method: "DELETE",
      route: "/api/upload-image",
      message: "Error deleting file",
      error,
    });
    return errorResponse("Failed to delete file", 500);
  }
});
