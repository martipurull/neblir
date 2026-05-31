export type SuperAdminCatalogueCreatedKind =
  | "item"
  | "feature"
  | "path"
  | "enemy"
  | "map"
  | "reference";

export function parseCreatedCatalogueId(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("id" in body)) {
    return null;
  }
  const id = (body as { id: unknown }).id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

export function superAdminCatalogueCreatedHref(
  kind: SuperAdminCatalogueCreatedKind,
  id: string
): string {
  const segment = CATALOGUE_CREATED_PAGE_SEGMENT[kind];
  return `/home/super-admin/${segment}/created?id=${encodeURIComponent(id)}`;
}

const CATALOGUE_CREATED_PAGE_SEGMENT: Record<
  SuperAdminCatalogueCreatedKind,
  string
> = {
  item: "items",
  feature: "features",
  path: "paths",
  enemy: "enemies",
  map: "maps",
  reference: "reference",
};
