"use client";

import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageTitle from "@/app/components/shared/PageTitle";
import ResourceListCard from "@/app/components/shared/ResourceListCard";
import { useGame } from "@/hooks/use-game";
import { useImageUrls } from "@/hooks/use-image-urls";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";

export default function GameCharactersPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { game, loading, error, refetch } = useGame(id);
  const [listOpen, setListOpen] = useState(true);

  const imageEntries = useMemo(
    () =>
      game?.characters?.map((gc) => ({
        id: gc.character.id,
        imageKey: gc.character.avatarKey,
      })) ?? [],
    [game]
  );
  const imageUrls = useImageUrls(imageEntries);

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

  const characters = game.characters ?? [];
  const count = characters.length;

  return (
    <PageSection>
      <div className="mb-4 flex items-center gap-2">
        <Link
          href={`/home/games/${game.id}`}
          className="text-sm text-black/70 hover:underline"
        >
          ← {game.name}
        </Link>
      </div>
      <PageTitle>Characters</PageTitle>
      <p className="mt-1 text-sm text-black/70">
        Characters linked to this game ({count})
      </p>

      <InfoCard border={false} className="mt-4">
        <button
          type="button"
          onClick={() => setListOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-md border border-black px-4 py-3 text-left hover:bg-black/5"
          aria-expanded={listOpen}
        >
          <span className="text-sm font-semibold text-black">
            {count > 0
              ? `${count} character${count === 1 ? "" : "s"}`
              : "No characters"}
          </span>
          <span className="text-xs text-black" aria-hidden>
            {listOpen ? "▲" : "▼"}
          </span>
        </button>
        {listOpen && (
          <div className="mt-2 space-y-2 border-t border-black/10 pt-2">
            {characters.length === 0 ? (
              <p className="py-2 text-sm text-black/60">
                No characters linked to this game yet.
              </p>
            ) : (
              characters.map((gc) => {
                const char = gc.character;
                const name = `${char.name}${char.surname ? ` ${char.surname}` : ""}`;
                const avatarUrl = char.avatarKey
                  ? (imageUrls[char.id] ?? undefined)
                  : null;
                const initials =
                  char.name.charAt(0).toUpperCase() +
                  (char.surname?.charAt(0).toUpperCase() ?? "");
                return (
                  <ResourceListCard
                    key={gc.id}
                    href={`/home/characters/${char.id}`}
                    title={name}
                    subtitle="View character sheet"
                    imageUrl={avatarUrl}
                    imageAlt={`${name} avatar`}
                    placeholder={initials}
                  />
                );
              })
            )}
          </div>
        )}
      </InfoCard>
    </PageSection>
  );
}
