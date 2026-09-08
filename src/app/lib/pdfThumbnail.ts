import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { S3Client } from "@aws-sdk/client-s3";
import {
  PDF_THUMBNAIL_CONTENT_TYPE,
  PDF_THUMBNAIL_FILE_NAME,
  buildPdfThumbnailKey,
  imageContentTypeFromFileName,
  type PdfThumbnailUploadType,
} from "@/app/lib/r2UploadKeys";

type R2Config = {
  s3Client: S3Client;
  bucketName: string;
};

export async function presignPdfThumbnailUpload(
  config: R2Config,
  type: PdfThumbnailUploadType,
  expiresIn: number
): Promise<{ thumbnailFileKey: string; thumbnailUploadUrl: string }> {
  const thumbnailFileKey = buildPdfThumbnailKey(type);
  const thumbnailUploadUrl = await getSignedUrl(
    config.s3Client,
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: thumbnailFileKey,
      ContentType: PDF_THUMBNAIL_CONTENT_TYPE,
    }),
    { expiresIn }
  );
  return { thumbnailFileKey, thumbnailUploadUrl };
}

export async function signPdfThumbnailGetUrl(
  config: R2Config,
  thumbnailKey: string
): Promise<string | null> {
  try {
    return await getSignedUrl(
      config.s3Client,
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: thumbnailKey,
        ResponseContentDisposition: `inline; filename="${PDF_THUMBNAIL_FILE_NAME}"`,
        ResponseContentType: imageContentTypeFromFileName(thumbnailKey),
      }),
      { expiresIn: 3600 }
    );
  } catch {
    return null;
  }
}
