import { getAllFeatures } from "@/app/lib/prisma/feature";
import { getEnemies } from "@/app/lib/prisma/enemy";
import { getItems } from "@/app/lib/prisma/item";
import { getMaps } from "@/app/lib/prisma/map";
import { getPaths } from "@/app/lib/prisma/path";
import { getReferenceEntries } from "@/app/lib/prisma/referenceEntry";
import { scrubCatalogueExportMeta } from "@/app/lib/catalogueSeedScrub";
import type { CatalogueExportDomain } from "@/app/lib/catalogueExportResolve";

function jsonRoundTrip<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Loads current DB rows for the given catalogue domains and returns a JSON-safe
 * payload (seed-style: no `protectedFromOfficialImport`).
 */
export async function buildCatalogueSeedDataExport(
  domains: CatalogueExportDomain[]
): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};
  const want = new Set(domains);

  if (want.has("items")) {
    const rows = await getItems();
    data.items = rows.map((row) =>
      scrubCatalogueExportMeta(jsonRoundTrip(row))
    );
  }
  if (want.has("enemies")) {
    const rows = await getEnemies();
    data.enemies = rows.map((row) =>
      scrubCatalogueExportMeta(jsonRoundTrip(row))
    );
  }
  if (want.has("paths")) {
    const rows = await getPaths();
    data.paths = rows.map((row) =>
      scrubCatalogueExportMeta(jsonRoundTrip(row))
    );
  }
  if (want.has("features")) {
    const rows = await getAllFeatures();
    data.features = rows.map((row) =>
      scrubCatalogueExportMeta(jsonRoundTrip(row))
    );
  }
  if (want.has("maps")) {
    const rows = await getMaps({ gameId: null });
    data.maps = rows.map((row) => scrubCatalogueExportMeta(jsonRoundTrip(row)));
  }
  if (want.has("reference")) {
    const rows = await getReferenceEntries({ gameId: null });
    data.reference = rows.map((row) =>
      scrubCatalogueExportMeta(jsonRoundTrip(row))
    );
  }

  return data;
}
