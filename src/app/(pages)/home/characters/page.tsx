"use client";

import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageSubtitle from "@/app/components/shared/PageSubtitle";
import PageTitle from "@/app/components/shared/PageTitle";
import { useCharacters } from "@/hooks/use-characters";
import { useImageUrls } from "@/hooks/use-image-urls";
import Image from "next/image";
import React, { useMemo } from "react";

const CharactersPage: React.FC = () => {
  const { characters, loading, error, refetch } = useCharacters();
  const imageEntries = useMemo(
    () =>
      characters.map((character) => ({
        id: character.id,
        imageKey: character.avatarKey,
      })),
    [characters]
  );
  const avatarUrls = useImageUrls(imageEntries);

  return (
    <PageSection>
      <PageTitle>Characters</PageTitle>
      <PageSubtitle>
        Create and manage your character sheets, inventory, and progression.
      </PageSubtitle>
      <InfoCard border={false}>
        {loading && <LoadingState text="Loading characters..." />}

        {!loading && error && (
          <ErrorState message={error} onRetry={refetch} retryLabel="Retry" />
        )}

        {!loading && !error && characters.length === 0 && (
          <p className="text-sm text-gray-600">No characters found.</p>
        )}

        {!loading && !error && characters.length > 0 && (
          <div className="space-y-2">
            {characters.map((character) => (
              <article
                key={character.id}
                className="flex items-center gap-3 rounded-md border border-gray-200 px-5 py-4"
              >
                <div className="h-12 w-12 shrink-0 rounded-full bg-gray-100">
                  {character.avatarKey &&
                  typeof avatarUrls[character.id] === "string" ? (
                    <Image
                      src={avatarUrls[character.id] as string}
                      alt={`${character.name} avatar`}
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover object-top"
                    />
                  ) : character.avatarKey &&
                    avatarUrls[character.id] === undefined ? (
                    <div className="flex h-full items-center justify-center text-[10px] text-gray-500">
                      ...
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-gray-500">
                      {character.name.charAt(0).toUpperCase() +
                        (character.surname?.charAt(0).toUpperCase() ??
                          character.name.charAt(1).toUpperCase())}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {character.name}
                    {character.surname ? ` ${character.surname}` : ""}
                  </p>
                  <p className="text-xs text-gray-600">
                    LVL {character.level} ·{" "}
                    {character.paths.length > 0
                      ? character.paths.join(" / ")
                      : "No path"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </InfoCard>
    </PageSection>
  );
};

export default CharactersPage;
