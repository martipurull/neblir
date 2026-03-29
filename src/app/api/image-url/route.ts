import { getR2Config } from "@/app/lib/r2";
import type { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import logger from "@/logger";
import { NextResponse } from "next/server";
import { errorResponse } from "../shared/responses";

export const GET = auth(async (request: AuthNextRequest) => {
  try {
    if (!request.auth?.user) {
      logger.error({
        method: "GET",
        route: "/api/image-url",
        message: "Unauthorised access attempt",
      });
      return errorResponse("Unauthorised", 401);
    }

    const imageKey = request.nextUrl.searchParams.get("imageKey");
    if (!imageKey) {
      logger.error({
        method: "GET",
        route: "/api/image-url",
        message: "Image key is required",
      });
      return errorResponse("Image key is required", 400);
    }

    const config = getR2Config();
    if (!config) {
      logger.error({
        method: "GET",
        route: "/api/image-url",
        message: "R2 credentials are missing in environment variables",
      });
      return errorResponse(
        "R2 credentials are missing in environment variables",
        500
      );
    }

    const getObjectCommand = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: imageKey,
    });

    const signedUrl = await getSignedUrl(config.s3Client, getObjectCommand, {
      expiresIn: 3600,
    });

    return NextResponse.json({ url: signedUrl }, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/image-url",
      message: "Error generating image URL",
      error,
    });
    return errorResponse("Error fetching image URL", 500);
  }
});
