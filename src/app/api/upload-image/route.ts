import { userIsSuperAdmin } from "@/app/lib/authz/superAdmin";
import {
  IMAGE_MAX_SIZE_BYTES,
  IMAGE_MAX_SIZE_LABEL,
} from "@/app/lib/constants/uploadLimits";
import { getR2Config, isDeletableUploadKey } from "@/app/lib/r2";
import { buildUploadKey, type UploadKeyType } from "@/app/lib/r2UploadKeys";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@/logger";
import { NextResponse } from "next/server";
import { errorResponse } from "../shared/responses";

const ALLOWED_TYPES = [
  "custom_items",
  "custom_enemies",
  "unique_items",
  "games",
  "characters",
  "items",
  "maps",
] as const satisfies readonly UploadKeyType[];

function getExtension(filename: string): string {
  const last = filename.split(".").pop()?.toLowerCase();
  const allowed = ["jpg", "jpeg", "png", "gif", "webp"];
  return last && allowed.includes(last) ? last : "png";
}

export const POST = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      return errorResponse("Unauthorised", 401);
    }

    const type = request.nextUrl.searchParams.get("type");
    if (type === "recaps") {
      return errorResponse(
        "Recap PDFs must be uploaded via /api/recap-upload-url",
        400
      );
    }
    if (
      !type ||
      !ALLOWED_TYPES.includes(type as (typeof ALLOWED_TYPES)[number])
    ) {
      return errorResponse(
        "Query param 'type' must be one of: custom_items, custom_enemies, unique_items, games, characters, items, maps",
        400
      );
    }

    if (type === "items" || type === "maps") {
      if (!(await userIsSuperAdmin(request.auth.user.id))) {
        return errorResponse("Forbidden", 403);
      }
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
    if (blob.size > IMAGE_MAX_SIZE_BYTES) {
      return errorResponse(
        `File must be ${IMAGE_MAX_SIZE_LABEL} or smaller`,
        400
      );
    }

    const key = buildUploadKey(type as UploadKeyType, blob.name);
    const ext = getExtension(blob.name);
    const buffer = Buffer.from(await blob.arrayBuffer());

    await config.s3Client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: blob.type || `image/${ext}`,
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
