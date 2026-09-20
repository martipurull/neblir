import {
  getCatalogueR2Config,
  isCatalogueImageKey,
  isDeletableUploadKey,
} from "@/app/lib/r2";
import { countOfficialRowsWithCatalogueImageKey } from "@/app/lib/prisma/officialCatalogueImage";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "@/logger";

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
