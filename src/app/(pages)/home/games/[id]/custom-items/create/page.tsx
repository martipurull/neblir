"use client";

import CreateCustomItemModal from "@/app/components/games/CreateCustomItemModal";
import ErrorState from "@/app/components/shared/ErrorState";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import { useGame } from "@/hooks/use-game";
import { useParams, useRouter } from "next/navigation";
import React from "react";

export default function CreateGameCustomItemPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : null;
  const { game, loading, error, refetch, mutate } = useGame(id);

  if (loading || (!game && !error)) {
    return (
      <PageSection>
        <LoadingState text="Loading game..." />
      </PageSection>
    );
  }

  if (error || !game) {
    return (
      <PageSection>
        <ErrorState
          message={error ?? "Game not found"}
          onRetry={refetch}
          retryLabel="Retry"
        />
      </PageSection>
    );
  }

  if (!game.isGameMaster) {
    return (
      <PageSection>
        <ErrorState
          message="Only the game master can create custom items for this game."
          onRetry={() => router.push(`/home/games/${game.id}/custom-items`)}
          retryLabel="Back to custom items"
        />
      </PageSection>
    );
  }

  return (
    <CreateCustomItemModal
      isOpen
      gameId={game.id}
      gameName={game.name}
      onClose={() => router.push(`/home/games/${game.id}/custom-items`)}
      onSuccess={() => {
        void mutate();
      }}
    />
  );
}
