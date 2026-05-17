import PageSection from "@/app/components/shared/PageSection";
import type { SuperAdminCatalogueCreatedKind } from "../_utils/superAdminCatalogueCreated";
import { SuperAdminCatalogueCreatedConfirmation } from "./SuperAdminCatalogueCreatedConfirmation";
import { Suspense } from "react";

export default function SuperAdminCatalogueCreatedPage({
  kind,
}: {
  kind: SuperAdminCatalogueCreatedKind;
}) {
  return (
    <PageSection>
      <Suspense
        fallback={
          <p className="text-sm text-black/70" role="status">
            Loading…
          </p>
        }
      >
        <SuperAdminCatalogueCreatedConfirmation kind={kind} />
      </Suspense>
    </PageSection>
  );
}
