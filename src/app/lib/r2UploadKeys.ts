const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"] as const;
const ALLOWED_RECAP_EXTENSIONS = ["pdf"] as const;

export type UploadKeyType =
  | "custom_items"
  | "custom_enemies"
  | "unique_items"
  | "games"
  | "characters"
  | "items"
  | "maps"
  | "recaps";

function getImageExtension(filename: string): string {
  const last = filename.split(".").pop()?.toLowerCase();
  return last &&
    ALLOWED_IMAGE_EXTENSIONS.includes(
      last as (typeof ALLOWED_IMAGE_EXTENSIONS)[number]
    )
    ? last
    : "png";
}

function getRecapExtension(filename: string): string {
  const last = filename.split(".").pop()?.toLowerCase();
  return last &&
    ALLOWED_RECAP_EXTENSIONS.includes(
      last as (typeof ALLOWED_RECAP_EXTENSIONS)[number]
    )
    ? last
    : "pdf";
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

/** Build key: {type}-{sanitized_basename}-{shortId}.{ext} e.g. recaps-session_3-abc12.pdf */
export function buildUploadKey(
  type: UploadKeyType,
  originalFilename: string
): string {
  const ext =
    type === "recaps"
      ? getRecapExtension(originalFilename)
      : getImageExtension(originalFilename);
  const base = sanitizeFilenameBasename(originalFilename);
  return `${type}-${base}-${shortId()}.${ext}`;
}

export function isValidRecapFileKey(fileKey: string): boolean {
  return fileKey.startsWith("recaps-") && fileKey.endsWith(".pdf");
}

export function isPdfFileName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".pdf");
}
