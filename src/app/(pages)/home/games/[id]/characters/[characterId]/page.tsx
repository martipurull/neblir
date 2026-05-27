"use client";

import { CharacterDetailView } from "@/app/components/character/CharacterDetailView";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { PageSection } from "@/app/components/shared/PageSection";
import { useGameCharacterView } from "@/hooks/use-game-character-view";
import { useParams } from "next/navigation";

export default function GameCharacterViewPage() {
  const params = useParams();
  const gameId = typeof params.id === "string" ? params.id : null;
  const characterId =
    typeof params.characterId === "string" ? params.characterId : null;
  const { character, loading, error, refetch } = useGameCharacterView(
    gameId,
    characterId
  );

  if (gameId == null || characterId == null) {
    return (
      <PageSection>
        <p className="text-sm text-neblirDanger-600">Invalid character link.</p>
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

  return (
    <CharacterDetailView character={character} readOnly fixedGameId={gameId} />
  );
}
