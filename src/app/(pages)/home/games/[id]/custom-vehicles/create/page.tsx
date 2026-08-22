"use client";

import { CreateCustomVehicleModal } from "@/app/components/games/CreateCustomVehicleModal";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { PageSection } from "@/app/components/shared/PageSection";
import { useGame } from "@/hooks/use-game";
import { useParams, useRouter } from "next/navigation";

export default function CreateGameCustomVehiclePage() {
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
          message="Only the game master can create custom vehicles for this game."
          onRetry={() => router.push(`/home/games/${game.id}/custom-vehicles`)}
          retryLabel="Back to custom vehicles"
        />
      </PageSection>
    );
  }

  return (
    <CreateCustomVehicleModal
      isOpen
      gameId={game.id}
      gameName={game.name}
      editCustomVehicleId={null}
      onClose={() => router.push(`/home/games/${game.id}/custom-vehicles`)}
      onSuccess={() => {
        void mutate();
      }}
    />
  );
}
