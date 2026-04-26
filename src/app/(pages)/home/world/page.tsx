import { ReferenceEntriesPage } from "@/app/components/reference/ReferenceEntriesPage";

export default function WorldPage() {
  return (
    <ReferenceEntriesPage
      category="WORLD"
      title="World"
      description="Neblir is the only known continent in the world of Sikina."
      loadingText="Loading world lore..."
      emptyText="No world entries found."
    />
  );
}
