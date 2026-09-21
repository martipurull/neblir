"use client";

import { CATALOGUE_SEED_ZIP_FILENAME } from "@/app/lib/catalogueExportResolve";
import { scrubCatalogueExportMeta } from "@/app/lib/catalogueSeedScrub";

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(/[^\w.\-]+/g, "_");
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Trigger a browser download of pretty-printed JSON (for seed snippets). */
export function downloadJsonFile(filename: string, value: unknown) {
  const scrubbed = scrubCatalogueExportMeta(value);
  const blob = new Blob([JSON.stringify(scrubbed, null, 2)], {
    type: "application/json",
  });
  triggerBlobDownload(blob, filename);
}

function filenameFromContentDisposition(
  header: string | null,
  fallback: string
): string {
  const match = header?.match(/filename="([^"]+)"/);
  return match?.[1] ?? fallback;
}

export async function downloadCatalogueSeedFromApi(options: {
  scope: "touched" | "all";
  format: "array" | "zip";
  domains?: string;
}): Promise<void> {
  const params = new URLSearchParams({
    scope: options.scope,
    format: options.format,
  });
  if (options.domains) {
    params.set("domains", options.domains);
  }
  const res = await fetch(`/api/staff/catalogue-seed-export?${params}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: unknown };
    throw new Error(
      typeof body.message === "string"
        ? body.message
        : `Export failed (${res.status})`
    );
  }
  const blob = await res.blob();
  const fallback =
    options.format === "zip"
      ? CATALOGUE_SEED_ZIP_FILENAME
      : `${options.domains ?? "catalogue"}.json`;
  triggerBlobDownload(
    blob,
    filenameFromContentDisposition(
      res.headers.get("Content-Disposition"),
      fallback
    )
  );
}
