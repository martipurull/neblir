"use client";

import {
  CharacterSectionCarousel,
  type CharacterSectionSlide,
} from "@/app/components/character/CharacterSectionCarousel";
import { CharacterSummaryHeader } from "@/app/components/character/CharacterSummaryHeader";
import ErrorState from "@/app/components/shared/ErrorState";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import { useCharacter } from "@/hooks/use-character";
import { useImageUrls } from "@/hooks/use-image-urls";
import { useReactionTracking } from "@/hooks/use-reaction-tracking";
import { useParams } from "next/navigation";
import React, { useMemo } from "react";
import {
  getGeneralSection,
  getHealthSection,
  getAttributesSection,
  getSkillsSection,
  getCombatSection,
  getPathsSection,
  getInventorySection,
  getWalletSection,
  getNotesSection,
} from "./sections";

export default function CharacterDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { character, loading, error, refetch } = useCharacter(id);
  const reactionTracking = useReactionTracking(
    character?.combatInformation?.reactionsPerRound ?? 0
  );

  const imageEntries = useMemo(
    () =>
      character
        ? [
            {
              id: character.id,
              imageKey: character.generalInformation.avatarKey,
            },
            ...(character.wallet ?? []).map((entry) => ({
              id: entry.currencyName,
              imageKey: `currency-${entry.currencyName.toLowerCase()}.png`,
            })),
          ]
        : [],
    [character]
  );
  const imageUrls = useImageUrls(imageEntries);
  const avatarUrl =
    character != null ? (imageUrls[character.id] ?? null) : null;

  const sections: CharacterSectionSlide[] = useMemo(() => {
    if (!character) return [];
    const list: CharacterSectionSlide[] = [
      getGeneralSection(character),
      getHealthSection(character),
      getAttributesSection(character),
      getSkillsSection(character),
      getCombatSection(character, {
        onClearReactions: reactionTracking.clearReactions,
        usedReactions: reactionTracking.usedReactions,
      }),
    ];
    const pathsSection = getPathsSection(character);
    if (pathsSection) list.push(pathsSection);
    list.push(getInventorySection(character));
    const walletSection = getWalletSection(character, imageUrls);
    if (walletSection) list.push(walletSection);
    const notesSection = getNotesSection(character);
    if (notesSection) list.push(notesSection);
    return list;
  }, [
    character,
    imageUrls,
    reactionTracking.clearReactions,
    reactionTracking.usedReactions,
  ]);

  if (id == null) {
    return (
      <PageSection>
        <p className="text-sm text-neblirDanger-600">Invalid character.</p>
      </PageSection>
    );
  }

  if (loading) {
    return (
      <PageSection>
        <LoadingState text="Loading character..." />
      </PageSection>
    );
  }

  if (error || !character) {
    return (
      <PageSection>
        <ErrorState
          message={error ?? "Character not found"}
          onRetry={refetch}
          retryLabel="Retry"
        />
      </PageSection>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CharacterSummaryHeader
        character={character}
        avatarUrl={avatarUrl}
        usedReactions={reactionTracking.usedReactions}
        onUseReaction={reactionTracking.useReaction}
        className="shrink-0"
      />
      <CharacterSectionCarousel
        sections={sections}
        className="min-h-0 flex-1"
      />
    </div>
  );
}
