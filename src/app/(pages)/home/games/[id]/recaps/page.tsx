"use client";

import { CreateGameRecapModal } from "@/app/components/games/CreateGameRecapModal";
import { RecapCard } from "@/app/components/games/RecapCard";
import { Button } from "@/app/components/shared/Button";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { PageSection } from "@/app/components/shared/PageSection";
import { PageTitle } from "@/app/components/shared/PageTitle";
import type { GameRecap } from "@/app/lib/types/recap";
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
  const [recapModalOpen, setRecapModalOpen] = useState(false);
  const [recapEditTarget, setRecapEditTarget] = useState<GameRecap | null>(
    null
  );
  const isGameMaster = game?.isGameMaster === true;

  const handleOpen = async (recapId: string) => {
    const url = await getRecapDownloadUrl(recapId, "inline");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (recapId: string) => {
    const url = await getRecapDownloadUrl(recapId, "attachment");
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <PageTitle>Recaps</PageTitle>
            {game ? (
              <p className="mt-1 text-sm text-black/70">
                Session summaries for{" "}
                <span className="font-semibold">{game.name}</span>
              </p>
            ) : null}
          </div>
          {isGameMaster && game ? (
            <Button
              type="button"
              variant="solidDark"
              fullWidth={false}
              onClick={() => {
                setRecapEditTarget(null);
                setRecapModalOpen(true);
              }}
            >
              Upload recap
            </Button>
          ) : null}
        </div>
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
                onOpen={(recapId) => void handleOpen(recapId)}
                onDownload={(recapId) => void handleDownload(recapId)}
                canEdit={isGameMaster}
                canDelete={isGameMaster}
                deleting={deletingRecapId === recap.id}
                onEdit={(entry) => {
                  setRecapEditTarget(entry);
                  setRecapModalOpen(true);
                }}
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
      {game ? (
        <CreateGameRecapModal
          key={recapEditTarget?.id ?? "create"}
          isOpen={recapModalOpen}
          gameId={game.id}
          gameName={game.name}
          mode={recapEditTarget ? "edit" : "create"}
          recap={recapEditTarget}
          onClose={() => {
            setRecapModalOpen(false);
            setRecapEditTarget(null);
          }}
          onSuccess={() => {
            setRecapEditTarget(null);
            void refetch();
          }}
        />
      ) : null}
    </PageSection>
  );
}
