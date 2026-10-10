const CATALOGUE_ENVIRONMENTS = ["development", "production", "local"] as const;

export type CatalogueEnvironment = (typeof CATALOGUE_ENVIRONMENTS)[number];

export const CATALOGUE_ENVIRONMENT_LABELS: Record<
  CatalogueEnvironment,
  string
> = {
  development: "Development",
  production: "Production",
  local: "Local",
};

const PULLABLE_SOURCES: readonly CatalogueEnvironment[] = [
  "development",
  "production",
];

export type CatalogueSyncHubConfig = {
  thisEnvironment: CatalogueEnvironment | null;
  sources: CatalogueEnvironment[];
  destinations: CatalogueEnvironment[];
};

export function getCatalogueSyncHubConfig(): CatalogueSyncHubConfig {
  const thisEnvironment = getThisCatalogueEnvironment() ?? null;
  return {
    thisEnvironment,
    sources: [...PULLABLE_SOURCES],
    destinations:
      thisEnvironment === "local"
        ? ["development", "production", "local"]
        : ["development", "production"],
  };
}

function isCatalogueEnvironment(
  value: string | undefined
): value is CatalogueEnvironment {
  return (
    value !== undefined &&
    (CATALOGUE_ENVIRONMENTS as readonly string[]).includes(value)
  );
}

export function getThisCatalogueEnvironment():
  | CatalogueEnvironment
  | undefined {
  const raw = process.env.CATALOGUE_ENVIRONMENT?.trim();
  return isCatalogueEnvironment(raw) ? raw : undefined;
}

export function catalogueEnvironmentBaseUrl(
  environment: CatalogueEnvironment
): string | undefined {
  if (environment === "development") {
    const url = process.env.CATALOGUE_SYNC_DEVELOPMENT_URL?.trim();
    if (!url) return undefined;
    return url.replace(/\/$/u, "");
  }
  if (environment === "production") {
    const url = process.env.CATALOGUE_SYNC_PRODUCTION_URL?.trim();
    if (!url) return undefined;
    return url.replace(/\/$/u, "");
  }
  return undefined;
}

export function parseCatalogueEnvironmentParam(
  raw: string | null
): CatalogueEnvironment | undefined {
  const value = raw?.trim();
  return isCatalogueEnvironment(value) ? value : undefined;
}

export function isPullableCatalogueSource(
  environment: CatalogueEnvironment
): boolean {
  return PULLABLE_SOURCES.includes(environment);
}

export function catalogueSyncDestHubUrl(input: {
  dest: CatalogueEnvironment;
  source: CatalogueEnvironment;
}): string | undefined {
  const base = catalogueEnvironmentBaseUrl(input.dest);
  if (!base) return undefined;
  const params = new URLSearchParams({
    catalogueSyncSource: input.source,
    catalogueSyncDest: input.dest,
  });
  return `${base}/home/super-admin?${params.toString()}`;
}
