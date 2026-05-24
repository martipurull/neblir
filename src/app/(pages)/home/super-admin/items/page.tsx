import { PageSection } from "@/app/components/shared/PageSection";
import SuperAdminCreateItemForm from "../_components/SuperAdminCreateItemForm";

export default function SuperAdminItemsPage() {
  return (
    <PageSection className="!min-h-0">
      <SuperAdminCreateItemForm />
    </PageSection>
  );
}
