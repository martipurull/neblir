import { PageSection } from "@/app/components/shared/PageSection";
import { SuperAdminBotForm } from "../../../_components/SuperAdminBotForm";

export default async function SuperAdminEditBotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageSection className="!min-h-0">
      <SuperAdminBotForm editBotId={id} />
    </PageSection>
  );
}
