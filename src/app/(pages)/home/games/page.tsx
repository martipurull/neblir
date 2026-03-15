"use client";

import GameInvitesReceivedBlock from "@/app/components/games/GameInvitesReceivedBlock";
import GameListCard from "@/app/components/games/GameListCard";
import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageSubtitle from "@/app/components/shared/PageSubtitle";
import PageTitle from "@/app/components/shared/PageTitle";
import { useGameInvites } from "@/hooks/use-game-invites";
import { useGames } from "@/hooks/use-games";
import { useImageUrls } from "@/hooks/use-image-urls";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

const GamesPage: React.FC = () => {
  const { games, loading, error, refetch, mutate: mutateGames } = useGames();
  const { invites, mutate: mutateInvites } = useGameInvites();
  const router = useRouter();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const handleAccept = async (gameId: string) => {
    setAcceptingId(gameId);
    try {
      const res = await fetch(
        `/api/games/${encodeURIComponent(gameId)}/invites/accept`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to accept");
      void mutateInvites();
      void mutateGames();
      router.push(`/home/games/${gameId}`);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (gameId: string) => {
    setDecliningId(gameId);
    try {
      const res = await fetch(
        `/api/games/${encodeURIComponent(gameId)}/invites/decline`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to decline");
      void mutateInvites();
    } finally {
      setDecliningId(null);
    }
  };

  const imageEntries = useMemo(
    () =>
      games.map((game) => ({
        id: game.id,
        imageKey: game.imageKey,
      })),
    [games]
  );
  const imageUrls = useImageUrls(imageEntries);

  return (
    <PageSection>
      <PageTitle>Games</PageTitle>
      <PageSubtitle>
        Campaigns you’re part of—see who’s at the table and who’s running the
        game.
      </PageSubtitle>

      <GameInvitesReceivedBlock
        invites={invites}
        acceptingId={acceptingId}
        decliningId={decliningId}
        onAccept={(gameId) => void handleAccept(gameId)}
        onDecline={(gameId) => void handleDecline(gameId)}
      />

      <InfoCard border={false}>
        {loading && <LoadingState text="Loading games..." />}

        {!loading && error && (
          <ErrorState message={error} onRetry={refetch} retryLabel="Retry" />
        )}

        {!loading && !error && games.length === 0 && (
          <p className="text-sm text-black">No games found.</p>
        )}

        {!loading && !error && games.length > 0 && (
          <div className="space-y-2">
            {games.map((game) => (
              <GameListCard
                key={game.id}
                game={game}
                imageUrl={
                  game.imageKey ? (imageUrls[game.id] ?? undefined) : null
                }
              />
            ))}
          </div>
        )}
      </InfoCard>
    </PageSection>
  );
};

export default GamesPage;
