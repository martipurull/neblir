"use client";

import GameInvitesReceivedBlock from "@/app/components/games/GameInvitesReceivedBlock";
import GameListCard from "@/app/components/games/GameListCard";
import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageSubtitle from "@/app/components/shared/PageSubtitle";
import PageTitle from "@/app/components/shared/PageTitle";
import { useGameInviteActions } from "@/hooks/use-game-invite-actions";
import { useGameInvites } from "@/hooks/use-game-invites";
import { useGames } from "@/hooks/use-games";
import { useImageUrls } from "@/hooks/use-image-urls";
import Link from "next/link";
import React, { useMemo } from "react";

const GamesPage: React.FC = () => {
  const { games, loading, error, refetch, mutate: mutateGames } = useGames();
  const { invites, mutate: mutateInvites } = useGameInvites();
  const { acceptingId, decliningId, handleAccept, handleDecline } =
    useGameInviteActions({ mutateInvites, mutateGames });

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
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <PageTitle>Games</PageTitle>
          <PageSubtitle>
            Campaigns you’re part of—see who’s at the table and who’s running
            the game.
          </PageSubtitle>
        </div>
        <Link
          href="/home/games/create"
          className="inline-flex shrink-0 items-center justify-center rounded-md border border-black bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          Create Game
        </Link>
      </div>

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
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
