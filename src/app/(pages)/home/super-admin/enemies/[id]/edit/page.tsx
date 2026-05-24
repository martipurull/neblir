import { PageSection } from "@/app/components/shared/PageSection";
import SuperAdminEditEnemyForm from "../../../_components/SuperAdminEditEnemyForm";

export default async function SuperAdminEditEnemyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageSection className="!min-h-0">
      <SuperAdminEditEnemyForm enemyId={id} />
    </PageSection>
  );
}
