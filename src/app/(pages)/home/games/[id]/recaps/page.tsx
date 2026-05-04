"use client";

import RecapCard from "@/app/components/games/RecapCard";
import ErrorState from "@/app/components/shared/ErrorState";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import { useGame } from "@/hooks/use-game";
import { useGameRecaps } from "@/hooks/use-game-recaps";
import { deleteGameRecap, getRecapDownloadUrl } from "@/lib/api/recaps";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function GameRecapsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { game } = useGame(id);
  const { recaps, loading, error, refetch } = useGameRecaps(id);
  const [deletingRecapId, setDeletingRecapId] = useState<string | null>(null);
  const isGameMaster = game?.isGameMaster === true;

  const handleDownload = async (recapId: string) => {
    const url = await getRecapDownloadUrl(recapId);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!id) {
    return (
      <PageSection>
        <ErrorState message="Game not found" />
      </PageSection>
    );
  }

  return (
    <PageSection>
      <div className="flex flex-col gap-4">
        <PageTitle>Recaps</PageTitle>
        {loading ? (
          <LoadingState text="Loading recaps..." />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void refetch()} />
        ) : recaps.length === 0 ? (
          <p className="text-sm text-black/70">No recaps uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {recaps.map((recap) => (
              <RecapCard
                key={recap.id}
                recap={recap}
                onDownload={(recapId) => void handleDownload(recapId)}
                canDelete={isGameMaster}
                deleting={deletingRecapId === recap.id}
                onDelete={(entry) => {
                  if (!id) return;
                  if (
                    !window.confirm(
                      `Delete recap "${entry.title}"? This cannot be undone.`
                    )
                  ) {
                    return;
                  }
                  setDeletingRecapId(entry.id);
                  void deleteGameRecap(id, entry.id)
                    .then(async () => {
                      await refetch();
                    })
                    .finally(() => {
                      setDeletingRecapId(null);
                    });
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </PageSection>
  );
}
