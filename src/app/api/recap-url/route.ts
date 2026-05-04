import { getGameRecapById } from "@/app/lib/prisma/gameRecap";
import { userIsInGame } from "@/app/lib/prisma/game";
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
    if (!request.auth?.user?.id) {
      return errorResponse("Unauthorised", 401);
    }

    const recapId = request.nextUrl.searchParams.get("recapId");
    if (!recapId) {
      return errorResponse("Recap ID is required", 400);
    }

    const recap = await getGameRecapById(recapId);
    if (!recap) {
      return errorResponse("Recap not found", 404);
    }

    const inGame = await userIsInGame(recap.gameId, request.auth.user.id);
    if (!inGame) {
      return errorResponse("You are not part of this game", 403);
    }

    const config = getR2Config();
    if (!config) {
      return errorResponse("File download is not configured", 500);
    }

    const signedUrl = await getSignedUrl(
      config.s3Client,
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: recap.fileKey,
        ResponseContentDisposition: `attachment; filename="${recap.fileName}"`,
        ResponseContentType: "application/pdf",
      }),
      { expiresIn: 3600 }
    );

    return NextResponse.json({ url: signedUrl }, { status: 200 });
  } catch (error) {
    logger.error({
      method: "GET",
      route: "/api/recap-url",
      message: "Error generating recap URL",
      error,
    });
    return errorResponse("Error fetching recap URL", 500);
  }
});
