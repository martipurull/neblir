/** Prisma / API-only keys to omit from JSON meant for git seed files. */
const SCRUB_KEYS = new Set(["protectedFromOfficialImport"]);

/**
 * Deep-clone-ish cleanup for catalogue rows: removes `protectedFromOfficialImport`
 * everywhere and turns `Date` into ISO strings (via JSON round-trip safety on plain data).
 */
export function scrubCatalogueExportMeta(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((entry) => scrubCatalogueExportMeta(entry));
  }
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SCRUB_KEYS.has(k)) continue;
    out[k] = scrubCatalogueExportMeta(v);
  }
  return out;
}
