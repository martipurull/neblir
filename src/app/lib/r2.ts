import { S3Client } from "@aws-sdk/client-s3";
import type { UploadKeyType } from "@/app/lib/r2UploadKeys";

export type R2Config = {
  bucketName: string;
  s3Client: S3Client;
};

function r2ClientFromEnv(options: {
  accountId: string | undefined;
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  bucketName: string | undefined;
}): R2Config | null {
  const { accountId, accessKeyId, secretAccessKey, bucketName } = options;
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

export function getR2Config() {
  return r2ClientFromEnv({
    accountId: process.env.R2_NEBLIR_ACCOUNT_ID,
    accessKeyId: process.env.R2_NEBLIR_ACCOUNT_ACCESS_KEY,
    secretAccessKey: process.env.R2_NEBLIR_ACCOUNT_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_NEBLIR_BUCKET_NAME,
  });
}

export function getCatalogueR2Config() {
  return r2ClientFromEnv({
    accountId: process.env.R2_NEBLIR_ACCOUNT_ID,
    accessKeyId: process.env.R2_NEBLIR_CATALOGUE_BUCKET_ACCESS_KEY,
    secretAccessKey: process.env.R2_NEBLIR_CATALOGUE_BUCKET_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_NEBLIR_CATALOGUE_BUCKET_NAME,
  });
}

export const CATALOGUE_UPLOAD_TYPES = [
  "items",
  "vehicles",
  "maps",
  "enemies",
] as const satisfies readonly UploadKeyType[];

export type CatalogueUploadType = (typeof CATALOGUE_UPLOAD_TYPES)[number];

const CATALOGUE_READ_ONLY_KEY_PREFIXES = ["currencies-"] as const;

const CATALOGUE_UPLOAD_KEY_PREFIXES = CATALOGUE_UPLOAD_TYPES.map(
  (type) => `${type}-`
);

const CATALOGUE_KEY_PREFIXES = [
  ...CATALOGUE_UPLOAD_KEY_PREFIXES,
  ...CATALOGUE_READ_ONLY_KEY_PREFIXES,
];

export function isCatalogueUploadType(
  type: string
): type is CatalogueUploadType {
  return (CATALOGUE_UPLOAD_TYPES as readonly string[]).includes(type);
}

export function isCatalogueImageKey(key: string): boolean {
  return CATALOGUE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function getR2ConfigForKey(key: string): R2Config | null {
  return isCatalogueImageKey(key) ? getCatalogueR2Config() : getR2Config();
}

const ALLOWED_UPLOAD_PREFIXES = [
  "custom_items-",
  "custom_enemies-",
  "custom_maps-",
  "unique_items-",
  "custom_vehicles-",
  "unique_vehicles-",
  "games-",
  "characters-",
  ...CATALOGUE_UPLOAD_KEY_PREFIXES,
  "recaps-",
  "files-",
  "lore-",
] as const;

export function isDeletableUploadKey(key: string): boolean {
  return ALLOWED_UPLOAD_PREFIXES.some((prefix) => key.startsWith(prefix));
}
