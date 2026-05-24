import PageSection from "@/app/components/shared/PageSection";
import SuperAdminBrowsePathsClient from "../../_components/browse/SuperAdminBrowsePathsClient";

export default function SuperAdminBrowsePathsPage() {
  return (
    <PageSection className="!min-h-0">
      <SuperAdminBrowsePathsClient />
    </PageSection>
  );
}
