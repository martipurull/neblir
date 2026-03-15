import { S3Client } from "@aws-sdk/client-s3";

export function getR2Config() {
  const accountId = process.env.R2_NEBLIR_ACCOUNT_ID;
  const accessKeyId = process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY;
  const secretAccessKey = process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_NEBLIR_BUCKET_NAME;

  if (!accessKeyId || !secretAccessKey || !accountId || !bucketName) {
    return null;
  }
  return {
    bucketName,
    s3Client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    }),
  };
}

export const ALLOWED_UPLOAD_PREFIXES = [
  "custom_items-",
  "unique_items-",
] as const;

export function isDeletableImageKey(key: string): boolean {
  return ALLOWED_UPLOAD_PREFIXES.some((prefix) => key.startsWith(prefix));
}
