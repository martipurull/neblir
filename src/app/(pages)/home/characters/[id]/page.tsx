"use client";

import { CharacterDetailView } from "@/app/components/character/CharacterDetailView";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { PageSection } from "@/app/components/shared/PageSection";
import { useCharacter } from "@/hooks/use-character";
import { useParams } from "next/navigation";

export default function CharacterDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { character, loading, error, refetch, mutate } = useCharacter(id);

  if (id == null) {
    return (
      <PageSection>
        <p className="text-sm text-neblirDanger-600">Invalid character.</p>
      </PageSection>
    );
  }

  if (loading) {
    return (
      <PageSection>
        <LoadingState text="Loading character..." />
      </PageSection>
    );
  }

  if (error || !character) {
    return (
      <PageSection>
        <ErrorState
          message={error ?? "Character not found"}
          onRetry={refetch}
          retryLabel="Retry"
        />
      </PageSection>
    );
  }

  return <CharacterDetailView character={character} mutate={mutate} />;
}
