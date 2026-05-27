"use client";

import { Button } from "@/app/components/shared/Button";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { PageSection } from "@/app/components/shared/PageSection";
import { PageTitle } from "@/app/components/shared/PageTitle";
import { AddCharactersToGameModal } from "@/app/components/games/AddCharactersToGameModal";
import { GameLinkedCharactersList } from "@/app/components/games/GameLinkedCharactersList";
import { isGmControlledGameCharacter } from "@/app/lib/gmUtils";
import { useGame } from "@/hooks/use-game";
import { useImageUrls } from "@/hooks/use-image-urls";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function GameKnownNpcsPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { game, loading, error, refetch } = useGame(id);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const knownNpcs = useMemo(() => {
    if (!game?.characters) return [];
    return game.characters.filter((gc) =>
      isGmControlledGameCharacter(gc, game)
    );
  }, [game]);

  const alreadyLinkedCharacterIds = useMemo(
    () => (game?.characters ?? []).map((gc) => gc.character.id),
    [game?.characters]
  );

  const imageEntries = useMemo(
    () =>
      knownNpcs.map((gc) => ({
        id: gc.character.id,
        imageKey: gc.character.avatarKey,
      })),
    [knownNpcs]
  );
  const imageUrls = useImageUrls(imageEntries);
  const returnTo = game ? `/home/games/${game.id}/known-npcs` : "";

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

  return (
    <PageSection>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <PageTitle>Known NPCs</PageTitle>
          <p className="mt-1 text-sm text-black/70">
            Characters linked to{" "}
            <span className="font-semibold">{game.name}</span> and controlled by
            the game master.
          </p>
        </div>
        {game.isGameMaster ? (
          <Button
            type="button"
            variant="solidDark"
            fullWidth={false}
            onClick={() => setAddModalOpen(true)}
          >
            Add characters
          </Button>
        ) : null}
      </div>

      <AddCharactersToGameModal
        isOpen={addModalOpen}
        gameId={game.id}
        gameName={game.name}
        alreadyLinkedCharacterIds={alreadyLinkedCharacterIds}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => void refetch()}
      />

      <div className="mt-4">
        <GameLinkedCharactersList
          characters={knownNpcs}
          game={game}
          emptyText="No known NPCs for this game yet."
          returnTo={returnTo}
          imageUrls={imageUrls}
          onRemoved={() => {
            void refetch();
          }}
        />
      </div>
    </PageSection>
  );
}
