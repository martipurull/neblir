"use client";

import {
  CharacterSectionCarousel,
  type CharacterSectionSlide,
} from "@/app/components/character/CharacterSectionCarousel";
import { CharacterSummaryHeader } from "@/app/components/character/CharacterSummaryHeader";
import { DiceRollModal } from "@/app/components/character/DiceRollModal";
import ErrorState from "@/app/components/shared/ErrorState";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import type { DiceSelectionItem } from "@/app/lib/types/dice-roll";
import { isSameDiceSelection } from "@/app/lib/types/dice-roll";
import { useCharacter } from "@/hooks/use-character";
import { useCharacterStatUpdates } from "@/hooks/use-character-stat-updates";
import { useImageUrls } from "@/hooks/use-image-urls";
import { useReactionTracking } from "@/hooks/use-reaction-tracking";
import { useParams } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import {
  getGeneralSection,
  getHealthSection,
  getAttributesSection,
  getSkillsSection,
  getCombatSection,
  getPathsSection,
  getFeaturesSection,
  getInventorySection,
  getWalletSection,
  getNotesSection,
} from "./sections";

export default function CharacterDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { character, loading, error, refetch, mutate } = useCharacter(id);
  const { updateHealth, updateArmour } = useCharacterStatUpdates(
    id ?? "",
    character,
    mutate
  );
  const reactionTracking = useReactionTracking(
    character?.combatInformation?.reactionsPerRound ?? 0
  );

  const [diceSelection, setDiceSelection] = useState<DiceSelectionItem[]>([]);

  const handleDiceSelect = useCallback((item: DiceSelectionItem) => {
    setDiceSelection((prev) => {
      const idx = prev.findIndex((s) => isSameDiceSelection(s, item));
      if (idx >= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      if (prev.length >= 2) return prev;
      if (
        prev.length === 1 &&
        prev[0].type === "skill" &&
        item.type === "skill"
      ) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

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
      getAttributesSection(character, diceSelection, handleDiceSelect),
      getSkillsSection(character, diceSelection, handleDiceSelect),
      getCombatSection(character, {
        onClearReactions: reactionTracking.clearReactions,
        usedReactions: reactionTracking.usedReactions,
      }),
    ];
    const pathsSection = getPathsSection(character);
    if (pathsSection) list.push(pathsSection);
    const featuresSection = getFeaturesSection(character);
    if (featuresSection) list.push(featuresSection);
    list.push(getInventorySection(character, mutate));
    const walletSection = getWalletSection(
      character,
      imageUrls,
      character.id,
      mutate
    );
    if (walletSection) list.push(walletSection);
    const notesSection = getNotesSection(character);
    if (notesSection) list.push(notesSection);
    return list;
  }, [
    character,
    diceSelection,
    handleDiceSelect,
    imageUrls,
    mutate,
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
        onHealthUpdate={updateHealth}
        onArmourUpdate={updateArmour}
        className="shrink-0"
      />
      <CharacterSectionCarousel
        sections={sections}
        className="min-h-0 flex-1"
      />

      {character && diceSelection.length === 2 && (
        <DiceRollModal
          isOpen
          onClose={() => setDiceSelection([])}
          character={character}
          selection={[diceSelection[0], diceSelection[1]]}
        />
      )}
    </div>
  );
}
