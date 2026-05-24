import { PageSection } from "@/app/components/shared/PageSection";
import { SuperAdminEditPathForm } from "../../../_components/SuperAdminEditPathForm";

export default async function SuperAdminEditPathPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageSection className="!min-h-0">
      <SuperAdminEditPathForm pathId={id} />
    </PageSection>
  );
}
