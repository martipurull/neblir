export const CATALOGUE_EXPORT_DOMAIN_ORDER = [
  "items",
  "enemies",
  "paths",
  "features",
  "maps",
  "reference",
] as const;

export type CatalogueExportDomain =
  (typeof CATALOGUE_EXPORT_DOMAIN_ORDER)[number];

const KNOWN = new Set<string>(CATALOGUE_EXPORT_DOMAIN_ORDER);

export type CatalogueExportScope = "all" | "touched";

export function resolveCatalogueExportDomains(input: {
  scope: CatalogueExportScope;
  domainsParam: string | null;
  touchedDomains: string[];
}): { domains: CatalogueExportDomain[]; error?: string } {
  if (input.domainsParam && input.domainsParam.trim() !== "") {
    const list = input.domainsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const bad = list.filter((d) => !KNOWN.has(d));
    if (bad.length > 0) {
      return {
        domains: [],
        error: `Unknown domain(s): ${bad.join(", ")}. Expected one or more of: ${CATALOGUE_EXPORT_DOMAIN_ORDER.join(", ")}.`,
      };
    }
    const unique = [...new Set(list)].filter((d): d is CatalogueExportDomain =>
      KNOWN.has(d)
    );
    return { domains: unique };
  }

  if (input.scope === "all") {
    return { domains: [...CATALOGUE_EXPORT_DOMAIN_ORDER] };
  }

  const touched = [...new Set(input.touchedDomains)].filter(
    (d): d is CatalogueExportDomain => KNOWN.has(d)
  );
  return { domains: touched };
}
