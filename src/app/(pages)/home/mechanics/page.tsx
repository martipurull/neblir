import { ReferenceEntriesPage } from "@/app/components/reference/ReferenceEntriesPage";

export default function MechanicsPage() {
  return (
    <ReferenceEntriesPage
      category="MECHANICS"
      title="Mechanics"
      description="Rules and gameplay references for running and playing Neblir."
      loadingText="Loading mechanics..."
      emptyText="No mechanics entries found."
    />
  );
}
