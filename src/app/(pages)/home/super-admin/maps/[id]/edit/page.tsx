import { PageSection } from "@/app/components/shared/PageSection";
import { SuperAdminEditMapForm } from "../../../_components/SuperAdminEditMapForm";

export default async function SuperAdminEditMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageSection className="!min-h-0">
      <SuperAdminEditMapForm mapId={id} />
    </PageSection>
  );
}
