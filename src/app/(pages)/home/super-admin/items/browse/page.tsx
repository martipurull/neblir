import PageSection from "@/app/components/shared/PageSection";
import SuperAdminBrowseItemsClient from "../../_components/browse/SuperAdminBrowseItemsClient";

export default function SuperAdminBrowseItemsPage() {
  return (
    <PageSection className="!min-h-0">
      <SuperAdminBrowseItemsClient />
    </PageSection>
  );
}
