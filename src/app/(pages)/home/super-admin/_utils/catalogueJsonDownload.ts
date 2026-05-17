"use client";

import { scrubCatalogueExportMeta } from "@/app/lib/catalogueSeedScrub";

/** Trigger a browser download of pretty-printed JSON (for seed snippets). */
export function downloadJsonFile(filename: string, value: unknown) {
  const scrubbed = scrubCatalogueExportMeta(value);
  const blob = new Blob([JSON.stringify(scrubbed, null, 2)], {
    type: "application/json",
  });
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

export async function downloadCatalogueBundleFromApi(scope: "touched" | "all") {
  const res = await fetch(
    `/api/staff/catalogue-seed-export?scope=${encodeURIComponent(scope)}`
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof body?.message === "string"
        ? body.message
        : `Export failed (${res.status})`
    );
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  downloadJsonFile(`catalogue-seed-export-${scope}-${stamp}.json`, body);
}
