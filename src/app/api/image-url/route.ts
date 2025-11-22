import { AuthNextRequest } from "@/app/lib/types/api";
import { auth } from "@/auth";
import logger from "@/logger";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { errorResponse } from "../shared/responses";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


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

        const accessKeyId = process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY;
        const secretAccessKey = process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY;

        if (!accessKeyId || !secretAccessKey) {
            logger.error({
                method: "GET",
                route: "/api/image-url",
                message: "R2 credentials are missing in environment variables",
            });
            return errorResponse("R2 credentials are missing in environment variables", 500);
        }

        const s3Client = new S3Client({
            region: "auto",
            endpoint: `https://${process.env.R2_NEBLIR_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
            }
        })

        const getObjectCommand = new GetObjectCommand({
            Bucket: process.env.R2_NEBLIR_BUCKET_NAME,
            Key: imageKey,
        });

        const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });

        return NextResponse.json({ url: signedUrl }, { status: 200 });
    } catch (error) {
        logger.error({
            method: "GET",
            route: "/api/image-url",
            message: "Error generating image URL",
            error,
        });
        return errorResponse("Error fetching image URL", 500)
    }
});