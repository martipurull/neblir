const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"] as const;
const ALLOWED_PDF_EXTENSIONS = ["pdf"] as const;

export type UploadKeyType =
  | "custom_items"
  | "custom_enemies"
  | "unique_items"
  | "games"
  | "characters"
  | "items"
  | "maps"
  | "recaps"
  | "files"
  | "lore";

export type GameFileKind = "IMAGE" | "PDF";

function getImageExtension(filename: string): string {
  const last = filename.split(".").pop()?.toLowerCase();
  return last &&
    ALLOWED_IMAGE_EXTENSIONS.includes(
      last as (typeof ALLOWED_IMAGE_EXTENSIONS)[number]
    )
    ? last
    : "png";
}

function getPdfExtension(filename: string): string {
  const last = filename.split(".").pop()?.toLowerCase();
  return last &&
    ALLOWED_PDF_EXTENSIONS.includes(
      last as (typeof ALLOWED_PDF_EXTENSIONS)[number]
    )
    ? last
    : "pdf";
}

function getFilesExtension(filename: string): string {
  return isPdfFileName(filename)
    ? getPdfExtension(filename)
    : getImageExtension(filename);
}

export function loreAttachmentKindFromFileName(
  fileName: string
): GameFileKind | null {
  if (isPdfFileName(fileName)) return "PDF";
  if (isImageFileName(fileName)) return "IMAGE";
  return null;
}

export function contentTypeFromFileName(fileName: string): string {
  return isPdfFileName(fileName)
    ? "application/pdf"
    : imageContentTypeFromFileName(fileName);
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

function hasImageExtension(fileKey: string): boolean {
  const lower = fileKey.toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(`.${ext}`));
}

/** Build key: {type}-{sanitized_basename}-{shortId}.{ext} e.g. recaps-session_3-abc12.pdf */
export function buildUploadKey(
  type: UploadKeyType,
  originalFilename: string
): string {
  const ext =
    type === "recaps"
      ? getPdfExtension(originalFilename)
      : type === "files" || type === "lore"
        ? getFilesExtension(originalFilename)
        : getImageExtension(originalFilename);
  const base = sanitizeFilenameBasename(originalFilename);
  return `${type}-${base}-${shortId()}.${ext}`;
}

export function isValidRecapFileKey(fileKey: string): boolean {
  return (
    fileKey.startsWith("recaps-") && fileKey.toLowerCase().endsWith(".pdf")
  );
}

export function isValidGameFileKey(
  fileKey: string,
  kind: GameFileKind
): boolean {
  if (!fileKey.startsWith("files-")) return false;
  if (kind === "PDF") return fileKey.toLowerCase().endsWith(".pdf");
  return hasImageExtension(fileKey);
}

export function isValidLoreAttachmentFileKey(
  fileKey: string,
  kind?: GameFileKind
): boolean {
  if (!fileKey.startsWith("lore-")) return false;
  if (kind === "PDF") return fileKey.toLowerCase().endsWith(".pdf");
  if (kind === "IMAGE") return hasImageExtension(fileKey);
  return fileKey.toLowerCase().endsWith(".pdf") || hasImageExtension(fileKey);
}

export function isPdfFileName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".pdf");
}

export function isImageFileName(fileName: string): boolean {
  return hasImageExtension(fileName);
}

export function imageContentTypeFromFileName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "image/png";
  }
}
