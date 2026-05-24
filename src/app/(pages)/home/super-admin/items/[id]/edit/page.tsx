import { PageSection } from "@/app/components/shared/PageSection";
import { SuperAdminCreateItemForm } from "../../../_components/SuperAdminCreateItemForm";

export default async function SuperAdminEditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageSection className="!min-h-0">
      <SuperAdminCreateItemForm editItemId={id} />
    </PageSection>
  );
}
