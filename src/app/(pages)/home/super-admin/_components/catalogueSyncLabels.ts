import type { CatalogueExportDomain } from "@/app/lib/catalogueExportResolve";

export const CATALOGUE_SYNC_DOMAIN_LABELS: Record<
  CatalogueExportDomain,
  string
> = {
  items: "Items",
  vehicles: "Vehicles",
  enemies: "Enemies",
  paths: "Paths",
  features: "Features",
  maps: "Maps",
  reference: "Published reference entries",
};

export const CATALOGUE_SYNC_BUCKET_LABELS = {
  added: "Added",
  updated: "Updated",
  "dest-only": "Dest-only",
  blocked: "Blocked",
} as const;
