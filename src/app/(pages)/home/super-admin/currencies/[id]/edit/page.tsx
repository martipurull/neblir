import { PageSection } from "@/app/components/shared/PageSection";
import { SuperAdminEditCurrencyForm } from "../../../_components/SuperAdminEditCurrencyForm";

export default async function SuperAdminEditCurrencyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageSection className="!min-h-0">
      <SuperAdminEditCurrencyForm currencyId={id} />
    </PageSection>
  );
}
