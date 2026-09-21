const OFFICIAL_CATALOGUE_USAGE_DOMAINS = [
  "items",
  "vehicles",
  "enemies",
  "features",
  "maps",
  "reference",
] as const;

export type OfficialCatalogueUsageDomain =
  (typeof OFFICIAL_CATALOGUE_USAGE_DOMAINS)[number];

export type OfficialCatalogueUsageBreakdown = {
  characters: number;
  uniqueItems: number;
  uniqueVehicles: number;
  enemyInstances: number;
  favouriteWeaponRows: number;
  featureGrants: number;
};

const USAGE_DOMAIN_SET = new Set<string>(OFFICIAL_CATALOGUE_USAGE_DOMAINS);

export function isOfficialCatalogueUsageDomain(
  value: string
): value is OfficialCatalogueUsageDomain {
  return USAGE_DOMAIN_SET.has(value);
}

export function emptyOfficialCatalogueUsage(): OfficialCatalogueUsageBreakdown {
  return {
    characters: 0,
    uniqueItems: 0,
    uniqueVehicles: 0,
    enemyInstances: 0,
    favouriteWeaponRows: 0,
    featureGrants: 0,
  };
}

export function officialCatalogueUsageIsUnused(
  breakdown: OfficialCatalogueUsageBreakdown
): boolean {
  return (
    breakdown.characters === 0 &&
    breakdown.uniqueItems === 0 &&
    breakdown.uniqueVehicles === 0 &&
    breakdown.enemyInstances === 0 &&
    breakdown.favouriteWeaponRows === 0 &&
    breakdown.featureGrants === 0
  );
}
