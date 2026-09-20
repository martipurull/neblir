import {
  getCatalogueR2Config,
  getR2ConfigForKey,
  isCatalogueImageKey,
  isDeletableUploadKey,
} from "@/app/lib/r2";
import { countOfficialRowsWithCatalogueImageKey } from "@/app/lib/prisma/officialCatalogueImage";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  buildUploadKey,
  imageContentTypeFromFileName,
  type UploadKeyType,
} from "@/app/lib/r2UploadKeys";
import { logger } from "@/logger";

export class CatalogueImageCopyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogueImageCopyError";
  }
}

export async function copyImageToOfficialCatalogue(
  sourceKey: string | null | undefined,
  catalogueType: Extract<UploadKeyType, "items" | "vehicles" | "enemies">
): Promise<string | null> {
  const key = sourceKey?.trim();
  if (!key) return null;

  const sourceConfig = getR2ConfigForKey(key);
  const destConfig = getCatalogueR2Config();
  if (!sourceConfig || !destConfig) {
    throw new CatalogueImageCopyError("Image copy is not configured");
  }

  try {
    const source = await sourceConfig.s3Client.send(
      new GetObjectCommand({
        Bucket: sourceConfig.bucketName,
        Key: key,
      })
    );
    const bytes = await source.Body?.transformToByteArray();
    if (!bytes || bytes.byteLength === 0) {
      throw new CatalogueImageCopyError("Image copy failed");
    }

    const destKey = buildUploadKey(catalogueType, key);
    await destConfig.s3Client.send(
      new PutObjectCommand({
        Bucket: destConfig.bucketName,
        Key: destKey,
        Body: Buffer.from(bytes),
        ContentType: source.ContentType ?? imageContentTypeFromFileName(key),
      })
    );
    return destKey;
  } catch (error) {
    if (error instanceof CatalogueImageCopyError) throw error;
    throw new CatalogueImageCopyError("Image copy failed");
  }
}

export async function deleteUnreferencedCatalogueImageIfUnused(
  imageKey: string | null | undefined
): Promise<void> {
  if (
    !imageKey ||
    !isCatalogueImageKey(imageKey) ||
    !isDeletableUploadKey(imageKey)
  ) {
    return;
  }

  const remaining = await countOfficialRowsWithCatalogueImageKey(imageKey);
  if (remaining > 0) return;

  const config = getCatalogueR2Config();
  if (!config) {
    logger.error({
      message: "Catalogue R2 credentials missing; skipped image delete",
      imageKey,
    });
    return;
  }

  try {
    await config.s3Client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: imageKey,
      })
    );
  } catch (error) {
    logger.error({
      message: "Failed to delete unreferenced catalogue image",
      imageKey,
      error,
    });
  }
}
