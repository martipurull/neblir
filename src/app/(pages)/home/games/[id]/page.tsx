"use client";

import ErrorState from "@/app/components/shared/ErrorState";
import ImageLoadingSkeleton from "@/app/components/shared/ImageLoadingSkeleton";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import Image from "next/image";
import Link from "next/link";
import { useGame } from "@/hooks/use-game";
import { useImageUrls } from "@/hooks/use-image-urls";
import { useParams } from "next/navigation";
import { useMemo } from "react";

export default function GameDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { game, loading, error, refetch } = useGame(id);

  const imageEntries = useMemo(
    () =>
      game
        ? [
            { id: game.id, imageKey: game.imageKey },
            ...(game.characters ?? []).map((gc) => ({
              id: gc.character.id,
              imageKey: gc.character.avatarKey,
            })),
          ]
        : [],
    [game]
  );
  const imageUrls = useImageUrls(imageEntries);

  const gameImageUrl = game?.imageKey
    ? (imageUrls[game.id] ?? undefined)
    : null;
  const playerCharacterCount = useMemo(() => {
    if (!game?.characters) return 0;
    return game.characters.filter(
      (gc) => !gc.character.linkedUserIds?.includes(game.gameMaster)
    ).length;
  }, [game]);

  const knownNpcCount = useMemo(() => {
    if (!game?.characters || !game.gameMaster) return 0;
    return game.characters.filter((gc) =>
      gc.character.linkedUserIds?.includes(game.gameMaster)
    ).length;
  }, [game]);

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

  const isGameMaster = game.isGameMaster === true;
  const nextSessionDate =
    game.nextSession != null ? new Date(game.nextSession) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPastNextSession = nextSessionDate != null && nextSessionDate < today;
  const nextSessionLabel =
    nextSessionDate == null || (!isGameMaster && isPastNextSession)
      ? "No date set"
      : nextSessionDate.toLocaleDateString();

  return (
    <PageSection>
      <div className="flex flex-col gap-6">
        {/* Header: game name + thumbnail */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-black bg-paleBlue/20">
            {gameImageUrl ? (
              <Image
                src={gameImageUrl}
                alt=""
                width={64}
                height={64}
                className="h-full w-full object-cover object-top"
              />
            ) : gameImageUrl === undefined ? (
              <ImageLoadingSkeleton variant="cityscape" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-black">
                {game.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <PageTitle>{game.name}</PageTitle>
        </div>

        {/* Menu tiles */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-md border border-black p-4">
            <span className="text-sm font-semibold text-black">
              Next Session
            </span>
            <span className="mt-1 block text-xs text-black/70">
              {nextSessionLabel}
            </span>
          </div>
          {isGameMaster && (
            <Link
              href={`/home/games/${game.id}/gm`}
              className="block rounded-md border border-black p-4 transition-colors duration-200 ease-in-out md:hover:bg-paleBlue/30"
            >
              <span className="text-sm font-semibold text-black">
                Game Master
              </span>
              <span className="mt-1 block text-xs text-black/70">
                Invites, items, give items
              </span>
            </Link>
          )}
          <Link
            href={`/home/games/${game.id}/characters`}
            className="block rounded-md border border-black p-4 transition-colors duration-200 ease-in-out md:hover:bg-paleBlue/30"
          >
            <span className="text-sm font-semibold text-black">
              Player Characters
            </span>
            <span className="mt-1 block text-xs text-black/70">
              {playerCharacterCount} linked
            </span>
          </Link>
          <Link
            href={`/home/games/${game.id}/characters#known-npcs`}
            className="block rounded-md border border-black p-4 transition-colors duration-200 ease-in-out md:hover:bg-paleBlue/30"
          >
            <span className="text-sm font-semibold text-black">Known NPCs</span>
            <span className="mt-1 block text-xs text-black/70">
              {knownNpcCount} linked
            </span>
          </Link>
          <Link
            href={`/home/games/${game.id}/custom-items`}
            className="block rounded-md border border-black p-4 transition-colors duration-200 ease-in-out md:hover:bg-paleBlue/30"
          >
            <span className="text-sm font-semibold text-black">
              Custom Items
            </span>
            <span className="mt-1 block text-xs text-black/70">
              {game.customItems?.length ?? 0} items
            </span>
          </Link>
          <Link
            href={`/home/games/${game.id}/lore`}
            className="block rounded-md border border-black p-4 transition-colors duration-200 ease-in-out md:hover:bg-paleBlue/30"
          >
            <span className="text-sm font-semibold text-black">Lore</span>
            <span className="mt-1 block text-xs text-black/70">
              World & story
            </span>
          </Link>
          <Link
            href={`/home/games/${game.id}/images`}
            className="block rounded-md border border-black p-4 transition-colors duration-200 ease-in-out md:hover:bg-paleBlue/30"
          >
            <span className="text-sm font-semibold text-black">Images</span>
            <span className="mt-1 block text-xs text-black/70">
              Visual materials
            </span>
          </Link>
          <Link
            href={`/home/games/${game.id}/recaps`}
            className="block rounded-md border border-black p-4 transition-colors duration-200 ease-in-out md:hover:bg-paleBlue/30"
          >
            <span className="text-sm font-semibold text-black">Recaps</span>
            <span className="mt-1 block text-xs text-black/70">
              Browse and download session summaries
            </span>
          </Link>
        </div>
      </div>
    </PageSection>
  );
}
