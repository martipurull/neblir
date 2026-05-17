import PageSection from "@/app/components/shared/PageSection";
import SuperAdminEditFeatureForm from "../../../_components/SuperAdminEditFeatureForm";

export default async function SuperAdminEditFeaturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageSection className="!min-h-0">
      <SuperAdminEditFeatureForm featureId={id} />
    </PageSection>
  );
}
