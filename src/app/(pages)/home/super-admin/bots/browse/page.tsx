import { PageSection } from "@/app/components/shared/PageSection";
import { SuperAdminBrowseBotsClient } from "../../_components/browse/SuperAdminBrowseBotsClient";

export default function SuperAdminBrowseBotsPage() {
  return (
    <PageSection className="!min-h-0">
      <SuperAdminBrowseBotsClient />
    </PageSection>
  );
}
