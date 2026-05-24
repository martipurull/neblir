import { PageSection } from "@/app/components/shared/PageSection";
import SuperAdminBrowseEnemiesClient from "../../_components/browse/SuperAdminBrowseEnemiesClient";

export default function SuperAdminBrowseEnemiesPage() {
  return (
    <PageSection className="!min-h-0">
      <SuperAdminBrowseEnemiesClient />
    </PageSection>
  );
}
