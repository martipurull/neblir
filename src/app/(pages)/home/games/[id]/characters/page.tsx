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
import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useMemo, useState } from "react";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-black/60">{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

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

                if (char.isOwnedByCurrentUser) {
                  return (
                    <ResourceListCard
                      key={gc.id}
                      href={`/home/characters/${char.id}`}
                      title={name}
                      subtitle="View character sheet"
                      imageUrl={avatarUrl}
                      imageAlt={`${name} avatar`}
                      placeholder={initials}
                      className="!border-neblirSafe-200"
                    />
                  );
                }

                const gi = char.generalInformation;
                return (
                  <div
                    key={gc.id}
                    className="rounded-md border border-black/15 bg-white p-4"
                  >
                    <div className="flex items-start gap-3">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt=""
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black/10 text-sm font-medium text-black"
                          aria-hidden
                        >
                          {initials}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-black">{name}</p>
                        {gi && (
                          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-black/80 sm:grid-cols-3">
                            <InfoRow label="Level" value={String(gi.level)} />
                            <InfoRow label="Race" value={gi.race} />
                            <InfoRow label="Profession" value={gi.profession} />
                            <InfoRow label="Religion" value={gi.religion} />
                            <InfoRow label="Birthplace" value={gi.birthplace} />
                            <InfoRow label="Age" value={String(gi.age)} />
                            <InfoRow label="Height" value={`${gi.height} cm`} />
                            <InfoRow label="Weight" value={`${gi.weight} kg`} />
                          </dl>
                        )}
                        {char.backstory != null && char.backstory !== "" && (
                          <div className="mt-3 border-t border-black/10 pt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-black/60">
                              Backstory
                            </p>
                            <div
                              className="prose prose-sm mt-1 max-w-none text-black/80"
                              dangerouslySetInnerHTML={{
                                __html: char.backstory,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </InfoCard>
    </PageSection>
  );
}
