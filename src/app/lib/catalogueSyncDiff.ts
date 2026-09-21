import { CATALOGUE_EXPORT_DOMAIN_ORDER } from "@/app/lib/catalogueExportResolve";
import type { CatalogueExportDomain } from "@/app/lib/catalogueExportResolve";
import type { CatalogueEnvironment } from "@/app/lib/catalogueSyncEnv";
import { normalizeOfficialName } from "@/app/lib/officialName";
import type { CatalogueSyncSnapshotData } from "@/app/lib/catalogueSyncPull";

type CatalogueSyncBucket = "added" | "updated" | "dest-only" | "blocked";

type CatalogueSyncDiffRow = {
  id: string;
  label: string;
  bucket: CatalogueSyncBucket;
};

type CatalogueSyncDomainDiff = {
  added: number;
  updated: number;
  destOnly: number;
  blocked: number;
  rows: CatalogueSyncDiffRow[];
};

export type CatalogueSyncDiff = {
  totals: {
    added: number;
    updated: number;
    destOnly: number;
    blocked: number;
  };
  domains: Record<CatalogueExportDomain, CatalogueSyncDomainDiff>;
};

export type CatalogueSyncPreviewResponse = {
  thisEnvironment: CatalogueEnvironment;
  source: CatalogueEnvironment;
  dest: CatalogueEnvironment;
  destIsThisEnvironment: boolean;
  applyEnabled: boolean;
  destHubUrl: string | null;
  totals?: CatalogueSyncDiff["totals"];
  domains?: CatalogueSyncDiff["domains"];
};

export type CatalogueSyncApplyRow = {
  domain: CatalogueExportDomain;
  id: string;
};

export type CatalogueSyncApplyResult = {
  applied: CatalogueSyncApplyRow[];
  skipped: Array<CatalogueSyncApplyRow & { reason: "blocked" }>;
  failed: Array<CatalogueSyncApplyRow & { message: string }>;
};

const IGNORE_KEYS = new Set([
  "protectedFromOfficialImport",
  "createdAt",
  "updatedAt",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rowId(row: unknown): string | undefined {
  if (!isRecord(row)) return undefined;
  return typeof row.id === "string" && row.id.trim() !== ""
    ? row.id
    : undefined;
}

function isOfficialCatalogueRow(
  row: unknown,
  domain: CatalogueExportDomain
): boolean {
  if (!isRecord(row)) return false;
  if (domain !== "maps" && domain !== "reference") return true;
  return row.gameId == null;
}

function rowLabel(row: unknown, domain: CatalogueExportDomain): string {
  if (!isRecord(row)) return "";
  if (domain === "reference" && typeof row.slug === "string") {
    return row.slug;
  }
  if (typeof row.name === "string") return row.name;
  return rowId(row) ?? "";
}

function identityKey(
  row: unknown,
  domain: CatalogueExportDomain
): string | undefined {
  if (!isRecord(row)) return undefined;
  if (domain === "reference") {
    if (typeof row.slug !== "string" || row.slug.trim() === "") {
      return undefined;
    }
    const category = typeof row.category === "string" ? row.category : "";
    return `slug:${category}:${row.slug}`;
  }
  if (typeof row.name !== "string" || row.name.trim() === "") {
    return undefined;
  }
  return `name:${normalizeOfficialName(row.name)}`;
}

function omitIgnored(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(omitIgnored);
  if (!isRecord(value)) return value;
  const out: Record<string, unknown> = {};
  const keys = Object.keys(value).sort();
  for (const key of keys) {
    if (IGNORE_KEYS.has(key)) continue;
    out[key] = omitIgnored(value[key]);
  }
  return out;
}

function canonicalCatalogueSyncPayload(row: unknown): string {
  return JSON.stringify(omitIgnored(row));
}

function countBucket(
  rows: CatalogueSyncDiffRow[],
  bucket: CatalogueSyncBucket
): number {
  return rows.filter((row) => row.bucket === bucket).length;
}

export function diffCatalogueSyncSnapshots(input: {
  source: CatalogueSyncSnapshotData;
  dest: CatalogueSyncSnapshotData;
}): CatalogueSyncDiff {
  const domains = {} as Record<CatalogueExportDomain, CatalogueSyncDomainDiff>;
  const totals = { added: 0, updated: 0, destOnly: 0, blocked: 0 };

  for (const domain of CATALOGUE_EXPORT_DOMAIN_ORDER) {
    const sourceRows = (input.source[domain] ?? []).filter((row) =>
      isOfficialCatalogueRow(row, domain)
    );
    const destRows = (input.dest[domain] ?? []).filter((row) =>
      isOfficialCatalogueRow(row, domain)
    );

    const destById = new Map<string, unknown>();
    const destIdentityToId = new Map<string, string>();
    for (const row of destRows) {
      const id = rowId(row);
      if (!id) continue;
      destById.set(id, row);
      const identity = identityKey(row, domain);
      if (identity && !destIdentityToId.has(identity)) {
        destIdentityToId.set(identity, id);
      }
    }

    const sourceIds = new Set<string>();
    const rows: CatalogueSyncDiffRow[] = [];

    for (const row of sourceRows) {
      const id = rowId(row);
      if (!id) continue;
      sourceIds.add(id);
      const label = rowLabel(row, domain);
      const identity = identityKey(row, domain);
      const collidingDestId = identity
        ? destIdentityToId.get(identity)
        : undefined;
      if (collidingDestId && collidingDestId !== id) {
        rows.push({ id, label, bucket: "blocked" });
        continue;
      }
      const destRow = destById.get(id);
      if (!destRow) {
        rows.push({ id, label, bucket: "added" });
        continue;
      }
      if (
        canonicalCatalogueSyncPayload(row) !==
        canonicalCatalogueSyncPayload(destRow)
      ) {
        rows.push({ id, label, bucket: "updated" });
      }
    }

    for (const row of destRows) {
      const id = rowId(row);
      if (!id || sourceIds.has(id)) continue;
      rows.push({
        id,
        label: rowLabel(row, domain),
        bucket: "dest-only",
      });
    }

    const domainDiff: CatalogueSyncDomainDiff = {
      added: countBucket(rows, "added"),
      updated: countBucket(rows, "updated"),
      destOnly: countBucket(rows, "dest-only"),
      blocked: countBucket(rows, "blocked"),
      rows,
    };
    domains[domain] = domainDiff;
    totals.added += domainDiff.added;
    totals.updated += domainDiff.updated;
    totals.destOnly += domainDiff.destOnly;
    totals.blocked += domainDiff.blocked;
  }

  return { totals, domains };
}
