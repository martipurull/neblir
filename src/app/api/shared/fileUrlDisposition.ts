export type FileUrlDisposition = "inline" | "attachment";

export function parseFileUrlDisposition(
  raw: string | null
): FileUrlDisposition {
  return raw === "attachment" ? "attachment" : "inline";
}

export function contentDispositionHeader(
  disposition: FileUrlDisposition,
  filename: string
): string {
  return `${disposition}; filename="${filename}"`;
}
