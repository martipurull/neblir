import { PageSection } from "@/app/components/shared/PageSection";
import { SuperAdminBrowseCurrenciesClient } from "../../_components/browse/SuperAdminBrowseCurrenciesClient";

export default function SuperAdminBrowseCurrenciesPage() {
  return (
    <PageSection className="!min-h-0">
      <SuperAdminBrowseCurrenciesClient />
    </PageSection>
  );
}
