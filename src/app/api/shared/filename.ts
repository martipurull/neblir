const DEFAULT_ATTACHMENT_FILENAME_PART_MAX = 80;

/**
 * Sanitize a user-provided string for use in a Content-Disposition filename segment
 * (word chars, dots, hyphens; unsafe runs replaced with underscores). Truncates length.
 */
export function sanitizeAttachmentFilenamePart(
  raw: string,
  fallback: string,
  maxLength: number = DEFAULT_ATTACHMENT_FILENAME_PART_MAX
): string {
  const part = raw.replace(/[^\w.\-]+/g, "_").slice(0, maxLength);
  return part || fallback;
}
