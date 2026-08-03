import { PageSection } from "@/app/components/shared/PageSection";
import { SuperAdminVehicleForm } from "../_components/SuperAdminVehicleForm";

export default function SuperAdminVehiclesPage() {
  return (
    <PageSection className="!min-h-0">
      <SuperAdminVehicleForm />
    </PageSection>
  );
}
