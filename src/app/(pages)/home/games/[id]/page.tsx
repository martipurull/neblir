"use client";

import ErrorState from "@/app/components/shared/ErrorState";
import RecapCard from "@/app/components/games/RecapCard";
import ImageLoadingSkeleton from "@/app/components/shared/ImageLoadingSkeleton";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import { ThemedDatePicker } from "@/app/components/shared/ThemedDatePicker";
import Image from "next/image";
import Link from "next/link";
import { useGame } from "@/hooks/use-game";
import { useGameRecaps } from "@/hooks/use-game-recaps";
import { useImageUrls } from "@/hooks/use-image-urls";
import { updateGame } from "@/lib/api/game";
import { deleteGameRecap, getRecapDownloadUrl } from "@/lib/api/recaps";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function GameDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { game, loading, error, refetch, mutate } = useGame(id);
  const {
    recaps,
    loading: recapsLoading,
    error: recapsError,
    refetch: refetchRecaps,
  } = useGameRecaps(id);

  const [nextSessionBusy, setNextSessionBusy] = useState(false);
  const [nextSessionError, setNextSessionError] = useState<string | null>(null);
  const [deletingRecapId, setDeletingRecapId] = useState<string | null>(null);

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
  }, [game?.characters, game?.gameMaster]);

  const knownNpcCount = useMemo(() => {
    if (!game?.characters || !game.gameMaster) return 0;
    return game.characters.filter((gc) =>
      gc.character.linkedUserIds?.includes(game.gameMaster)
    ).length;
  }, [game?.characters, game?.gameMaster]);

  const nextSessionValue =
    game?.nextSession != null
      ? new Date(game.nextSession).toISOString().slice(0, 10)
      : "";
  const latestRecap = recaps[0] ?? null;

  const handleRecapDownload = async (recapId: string) => {
    const url = await getRecapDownloadUrl(recapId);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNextSessionChange = async (dateString: string) => {
    if (!game?.isGameMaster || !id) return;
    const value = dateString || null;
    setNextSessionError(null);
    setNextSessionBusy(true);
    try {
      const updated = await updateGame(id, {
        nextSession: value ? `${value}T12:00:00.000Z` : null,
      });
      await mutate(updated, false);
    } catch (err) {
      setNextSessionError(
        getUserSafeErrorMessage(err, "Failed to update date")
      );
    } finally {
      setNextSessionBusy(false);
    }
  };

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

        {/* Section boxes: Next session, GM (only for GM), Player characters, Known NPCs, Custom items, Lore */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <div className="flex flex-col rounded-md border border-black p-4">
            <span className="text-sm font-semibold text-black">
              Next Session
            </span>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ThemedDatePicker
                value={nextSessionValue}
                onChange={(dateString) =>
                  void handleNextSessionChange(dateString)
                }
                disabled={!isGameMaster || nextSessionBusy}
                ariaLabel="Next session date"
                placeholder="Set date"
              />
              {nextSessionError && (
                <p className="text-sm text-red-600">{nextSessionError}</p>
              )}
            </div>
          </div>
          {isGameMaster && (
            <Link
              href={`/home/games/${game.id}/gm`}
              className="flex flex-col rounded-md border border-black p-4 transition-colors duration-500 ease-in-out md:hover:bg-paleBlue/30"
            >
              <span className="text-sm font-semibold text-black">
                Game Master
              </span>
              <span className="mt-1 text-xs text-black/70">
                Invites, items, give items
              </span>
            </Link>
          )}
          <Link
            href={`/home/games/${game.id}/characters`}
            className="flex flex-col rounded-md border border-black p-4 transition-colors duration-500 ease-in-out md:hover:bg-paleBlue/30"
          >
            <span className="text-sm font-semibold text-black">
              Player Characters
            </span>
            <span className="mt-1 text-xs text-black/70">
              {playerCharacterCount} linked
            </span>
          </Link>
          <Link
            href={`/home/games/${game.id}/characters#known-npcs`}
            className="flex flex-col rounded-md border border-black p-4 transition-colors duration-500 ease-in-out md:hover:bg-paleBlue/30"
          >
            <span className="text-sm font-semibold text-black">Known NPCs</span>
            <span className="mt-1 text-xs text-black/70">
              {knownNpcCount} linked
            </span>
          </Link>
          <Link
            href={`/home/games/${game.id}/custom-items`}
            className="flex flex-col rounded-md border border-black p-4 transition-colors duration-500 ease-in-out md:hover:bg-paleBlue/30"
          >
            <span className="text-sm font-semibold text-black">
              Custom Items
            </span>
            <span className="mt-1 text-xs text-black/70">
              {game.customItems?.length ?? 0} items
            </span>
          </Link>
          <Link
            href={`/home/games/${game.id}/lore`}
            className="flex flex-col rounded-md border border-black p-4 transition-colors duration-500 ease-in-out md:hover:bg-paleBlue/30"
          >
            <span className="text-sm font-semibold text-black">Lore</span>
            <span className="mt-1 text-xs text-black/70">World & story</span>
          </Link>
          <Link
            href={`/home/games/${game.id}/images`}
            className="flex flex-col rounded-md border border-black p-4 transition-colors duration-500 ease-in-out md:hover:bg-paleBlue/30"
          >
            <span className="text-sm font-semibold text-black">Images</span>
            <span className="mt-1 text-xs text-black/70">Visual materials</span>
          </Link>
          <div className="rounded-md border border-black p-4">
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/home/games/${game.id}/recaps`}
                className="text-sm font-semibold text-black underline underline-offset-4"
              >
                Recaps
              </Link>
              <span className="text-xs text-black/70">
                {recaps.length} uploaded
              </span>
            </div>
            <div className="mt-3">
              {recapsLoading ? (
                <LoadingState text="Loading recaps..." />
              ) : recapsError ? (
                <ErrorState
                  message={recapsError}
                  onRetry={() => void refetchRecaps()}
                />
              ) : !latestRecap ? (
                <p className="text-sm text-black/70">
                  No recaps available yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  <RecapCard
                    recap={latestRecap}
                    onDownload={(recapId) => void handleRecapDownload(recapId)}
                    canDelete={isGameMaster}
                    deleting={deletingRecapId === latestRecap.id}
                    onDelete={(recap) => {
                      if (
                        !window.confirm(
                          `Delete recap "${recap.title}"? This cannot be undone.`
                        )
                      ) {
                        return;
                      }
                      setDeletingRecapId(recap.id);
                      void deleteGameRecap(game.id, recap.id)
                        .then(async () => {
                          await refetchRecaps();
                        })
                        .finally(() => {
                          setDeletingRecapId(null);
                        });
                    }}
                  />
                </ul>
              )}
            </div>
            <Link
              href={`/home/games/${game.id}/recaps`}
              className="mt-3 inline-block text-xs font-semibold text-black underline underline-offset-4"
            >
              View all
            </Link>
          </div>
        </div>
      </div>
    </PageSection>
  );
}
