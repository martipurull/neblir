import { PageSection } from "@/app/components/shared/PageSection";
import { SuperAdminBrowseVehiclesClient } from "../../_components/browse/SuperAdminBrowseVehiclesClient";

export default function SuperAdminBrowseVehiclesPage() {
  return (
    <PageSection className="!min-h-0">
      <SuperAdminBrowseVehiclesClient />
    </PageSection>
  );
}
