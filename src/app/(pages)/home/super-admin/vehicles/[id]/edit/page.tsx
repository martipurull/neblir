import { PageSection } from "@/app/components/shared/PageSection";
import { SuperAdminVehicleForm } from "../../../_components/SuperAdminVehicleForm";

export default async function SuperAdminEditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageSection className="!min-h-0">
      <SuperAdminVehicleForm editVehicleId={id} />
    </PageSection>
  );
}
