"use client";

import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageSubtitle from "@/app/components/shared/PageSubtitle";
import PageTitle from "@/app/components/shared/PageTitle";
import ResourceListCard from "@/app/components/shared/ResourceListCard";
import { useCharacters } from "@/hooks/use-characters";
import { useImageUrls } from "@/hooks/use-image-urls";
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
            {characters.map((character) => {
              const imageUrl = character.avatarKey
                ? (avatarUrls[character.id] ?? undefined)
                : null;
              const initials =
                character.name.charAt(0).toUpperCase() +
                (character.surname?.charAt(0).toUpperCase() ??
                  character.name.charAt(1)?.toUpperCase() ??
                  "");

              return (
                <ResourceListCard
                  key={character.id}
                  href={`/home/characters/${character.id}`}
                  title={`${character.name}${character.surname ? ` ${character.surname}` : ""}`}
                  subtitle={
                    <>
                      LVL {character.level} ·{" "}
                      {character.paths.length > 0
                        ? character.paths.join(" / ")
                        : "No path"}
                    </>
                  }
                  imageUrl={imageUrl}
                  imageAlt={`${character.name} avatar`}
                  placeholder={initials}
                />
              );
            })}
          </div>
        )}
      </InfoCard>
    </PageSection>
  );
};

export default CharactersPage;
