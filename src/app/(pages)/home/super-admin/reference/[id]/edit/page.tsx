import PageSection from "@/app/components/shared/PageSection";
import SuperAdminEditReferenceForm from "../../../_components/SuperAdminEditReferenceForm";

export default async function SuperAdminEditReferencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageSection className="!min-h-0">
      <SuperAdminEditReferenceForm entryId={id} />
    </PageSection>
  );
}
