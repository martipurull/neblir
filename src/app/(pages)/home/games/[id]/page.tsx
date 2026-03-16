"use client";

import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import { ThemedDatePicker } from "@/app/components/shared/ThemedDatePicker";
import Image from "next/image";
import Link from "next/link";
import { useGame } from "@/hooks/use-game";
import { useImageUrls } from "@/hooks/use-image-urls";
import { updateGame } from "@/lib/api/game";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";

export default function GameDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { game, loading, error, refetch, mutate } = useGame(id);

  const [nextSessionBusy, setNextSessionBusy] = useState(false);
  const [nextSessionError, setNextSessionError] = useState<string | null>(null);

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

  const nextSessionValue =
    game?.nextSession != null
      ? new Date(game.nextSession).toISOString().slice(0, 10)
      : "";

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
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-black bg-white/20">
            {gameImageUrl ? (
              <Image
                src={gameImageUrl}
                alt=""
                width={64}
                height={64}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-black">
                {game.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <PageTitle>{game.name}</PageTitle>
        </div>

        {/* Next session */}
        <InfoCard border>
          <h2 className="text-sm font-semibold text-black">Next Session</h2>
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
        </InfoCard>

        {/* Section boxes: GM (only for GM), Characters, Custom items, Lore */}
        <div className="grid gap-3 sm:grid-cols-3">
          {isGameMaster && (
            <Link
              href={`/home/games/${game.id}/gm`}
              className="flex flex-col rounded-md border border-black p-4 transition-colors hover:bg-black/5"
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
            className="flex flex-col rounded-md border border-black p-4 transition-colors hover:bg-black/5"
          >
            <span className="text-sm font-semibold text-black">Characters</span>
            <span className="mt-1 text-xs text-black/70">
              {game.characters?.length ?? 0} linked
            </span>
          </Link>
          <Link
            href={`/home/games/${game.id}/custom-items`}
            className="flex flex-col rounded-md border border-black p-4 transition-colors hover:bg-black/5"
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
            className="flex flex-col rounded-md border border-black p-4 transition-colors hover:bg-black/5"
          >
            <span className="text-sm font-semibold text-black">Lore</span>
            <span className="mt-1 text-xs text-black/70">World & story</span>
          </Link>
        </div>
      </div>
    </PageSection>
  );
}
