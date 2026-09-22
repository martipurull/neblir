import { getCatalogueSyncHubConfig } from "@/app/lib/catalogueSyncEnv";
import { SuperAdminPageClient } from "./SuperAdminPageClient";

export default async function SuperAdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    catalogueSyncSource?: string;
    catalogueSyncDest?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <SuperAdminPageClient
      catalogueSync={getCatalogueSyncHubConfig()}
      catalogueSyncSource={params.catalogueSyncSource}
      catalogueSyncDest={params.catalogueSyncDest}
    />
  );
}
