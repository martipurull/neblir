"use client";

import {
  CharacterSectionCarousel,
  type CharacterSectionSlide,
} from "@/app/components/character/CharacterSectionCarousel";
import { CharacterSectionGrid } from "@/app/components/character/CharacterSectionGrid";
import { CharacterSummaryHeader } from "@/app/components/character/CharacterSummaryHeader";
import { DedicatedDiceRollModal } from "@/app/components/character/DedicatedDiceRollModal";
import { DiceRollModal } from "@/app/components/character/DiceRollModal";
import { InitiativeOrderModal } from "@/app/components/combat/InitiativeOrderModal";
import { InitiativeRollModal } from "@/app/components/combat/InitiativeRollModal";
import type { DiceSelectionItem } from "@/app/lib/types/dice-roll";
import { isSameDiceSelection } from "@/app/lib/types/dice-roll";
import type { CharacterDetail } from "@/app/lib/types/character";
import { getGmRollPrivacyForCharacter } from "@/app/lib/roll-privacy";
import { useCharacterStatUpdates } from "@/hooks/use-character-stat-updates";
import { useImageUrls } from "@/hooks/use-image-urls";
import { useReactionTracking } from "@/hooks/use-reaction-tracking";
import { useActiveGameId } from "@/hooks/use-active-game-id";
import { useCharacterGameDetails } from "@/hooks/use-character-game-details";
import { useUser } from "@/hooks/use-user";
import type { KeyedMutator } from "swr";
import { useCallback, useMemo, useState } from "react";
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
} from "@/app/(pages)/home/characters/[id]/sections";

export type CharacterDetailViewProps = {
  character: CharacterDetail;
  readOnly?: boolean;
  /** Locks the active game context (used for GM read-only view). */
  fixedGameId?: string | null;
  mutate?: KeyedMutator<CharacterDetail | null>;
};

export function resolveCharacterLayoutMode(
  mode: "horizontal" | "vertical" | null | undefined
): "horizontal" | "vertical" {
  return mode ?? "horizontal";
}

export function CharacterDetailView({
  character,
  readOnly = false,
  fixedGameId = null,
  mutate,
}: CharacterDetailViewProps) {
  const { user } = useUser();
  const noopMutate = useCallback(
    async () => character,
    [character]
  ) as KeyedMutator<CharacterDetail | null>;

  const { updateHealth, updateArmour } = useCharacterStatUpdates(
    character.id,
    character,
    mutate ?? noopMutate
  );
  const reactionTracking = useReactionTracking(
    character.combatInformation?.reactionsPerRound ?? 0
  );

  const [diceSelection, setDiceSelection] = useState<DiceSelectionItem[]>([]);
  const [singleAttributeRollSelection, setSingleAttributeRollSelection] =
    useState<[DiceSelectionItem] | null>(null);
  const [initiativeRollOpen, setInitiativeRollOpen] = useState(false);
  const [initiativeOrderOpen, setInitiativeOrderOpen] = useState(false);
  const [initiativeOrderInitialGameId, setInitiativeOrderInitialGameId] =
    useState<string | null>(null);
  const [dedicatedDiceRollerOpen, setDedicatedDiceRollerOpen] = useState(false);

  const {
    activeGameId: storedActiveGameId,
    setActiveGameId,
    gameOptions: storedGameOptions,
  } = useActiveGameId(character.id, character.games);

  const activeGameId = fixedGameId ?? storedActiveGameId;
  const activeGameOptions = useMemo(() => {
    if (!fixedGameId) return storedGameOptions;
    const link = character.games?.find((g) => g.gameId === fixedGameId);
    if (!link) return [];
    return [
      {
        value: fixedGameId,
        label: link.game?.name ?? fixedGameId,
      },
    ];
  }, [character.games, fixedGameId, storedGameOptions]);

  const {
    gameDetails: initiativeGameDetails,
    loading: initiativeGamesLoading,
    refetch: refetchInitiativeGames,
  } = useCharacterGameDetails(readOnly ? null : character.id, character.games);

  const activeGameDetail = useMemo(() => {
    if (!activeGameId) return null;
    return initiativeGameDetails.find((g) => g.id === activeGameId) ?? null;
  }, [initiativeGameDetails, activeGameId]);

  const rollPrivacy = useMemo(
    () => getGmRollPrivacyForCharacter(activeGameDetail, character.id),
    [activeGameDetail, character.id]
  );

  const handleDiceSelect = useCallback(
    (item: DiceSelectionItem) => {
      if (readOnly) return;
      setSingleAttributeRollSelection(null);
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
    },
    [readOnly]
  );

  const handleSingleAttributeRoll = useCallback(
    (item: DiceSelectionItem) => {
      if (readOnly || item.type !== "attribute") return;
      setSingleAttributeRollSelection([item]);
    },
    [readOnly]
  );

  const imageEntries = useMemo(
    () => [
      {
        id: character.id,
        imageKey: character.generalInformation.avatarKey,
      },
      ...(character.wallet ?? []).map((entry) => ({
        id: entry.currencyName,
        imageKey: `currency-${entry.currencyName.toLowerCase()}.png`,
      })),
    ],
    [character]
  );
  const imageUrls = useImageUrls(imageEntries);
  const avatarKey = character.generalInformation.avatarKey;
  const avatarUrl = avatarKey ? imageUrls[character.id] : null;

  const sections: CharacterSectionSlide[] = useMemo(() => {
    const list: CharacterSectionSlide[] = [
      getAttributesSection(
        character,
        readOnly ? undefined : diceSelection,
        readOnly ? undefined : handleDiceSelect,
        readOnly ? undefined : handleSingleAttributeRoll,
        readOnly
      ),
      getSkillsSection(
        character,
        readOnly ? undefined : diceSelection,
        readOnly ? undefined : handleDiceSelect,
        readOnly
      ),
      getCombatSection(character, {
        onClearReactions: reactionTracking.clearReactions,
        usedReactions: readOnly ? 0 : reactionTracking.usedReactions,
        initiative: {
          gameDetails: initiativeGameDetails,
          gamesLoading: initiativeGamesLoading,
          onOpenRoll: () => setInitiativeRollOpen(true),
          onOpenOrder: () => {
            setInitiativeOrderInitialGameId(null);
            setInitiativeOrderOpen(true);
          },
        },
        readOnly,
      }),
      getGeneralSection(character),
      getHealthSection(character),
    ];
    const pathsSection = getPathsSection(character, {
      readOnly,
      mutate: readOnly ? undefined : mutate,
    });
    if (pathsSection) list.push(pathsSection);
    const featuresSection = getFeaturesSection(character);
    if (featuresSection) list.push(featuresSection);
    list.push(
      getInventorySection(character, activeGameId, {
        mutate: readOnly ? undefined : mutate,
        readOnly,
        rollPrivacy,
      })
    );
    const walletSection = getWalletSection(
      character,
      imageUrls,
      character.id,
      mutate ?? noopMutate,
      readOnly
    );
    if (walletSection) list.push(walletSection);
    if (!readOnly && mutate) {
      list.push(getNotesSection(character, mutate));
    }
    return list;
  }, [
    character,
    readOnly,
    diceSelection,
    handleDiceSelect,
    handleSingleAttributeRoll,
    imageUrls,
    mutate,
    noopMutate,
    reactionTracking.clearReactions,
    reactionTracking.usedReactions,
    initiativeGameDetails,
    initiativeGamesLoading,
    activeGameId,
    rollPrivacy,
  ]);

  const effectiveLayoutMode = resolveCharacterLayoutMode(
    user?.characterLayoutMode
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CharacterSummaryHeader
        character={character}
        activeGameId={activeGameId}
        activeGameOptions={activeGameOptions}
        onActiveGameChange={setActiveGameId}
        avatarUrl={avatarUrl}
        avatarKey={avatarKey}
        usedReactions={readOnly ? undefined : reactionTracking.usedReactions}
        onUseReaction={readOnly ? undefined : reactionTracking.useReaction}
        onHealthUpdate={readOnly ? undefined : updateHealth}
        onArmourUpdate={readOnly ? undefined : updateArmour}
        mutate={readOnly ? undefined : mutate}
        onOpenDiceRoller={
          readOnly ? undefined : () => setDedicatedDiceRollerOpen(true)
        }
        readOnly={readOnly}
        rollPrivacy={rollPrivacy}
        className="shrink-0"
      />
      {effectiveLayoutMode === "vertical" ? (
        <CharacterSectionGrid sections={sections} className="min-h-0 flex-1" />
      ) : (
        <CharacterSectionCarousel
          sections={sections}
          className="min-h-0 flex-1"
        />
      )}

      {!readOnly &&
        (diceSelection.length === 2 || singleAttributeRollSelection) && (
          <DiceRollModal
            isOpen
            onClose={() => {
              setDiceSelection([]);
              setSingleAttributeRollSelection(null);
            }}
            character={character}
            gameId={activeGameId}
            rollPrivacy={rollPrivacy}
            selection={
              singleAttributeRollSelection ??
              ([diceSelection[0], diceSelection[1]] as [
                DiceSelectionItem,
                DiceSelectionItem,
              ])
            }
          />
        )}

      {!readOnly && (
        <DedicatedDiceRollModal
          isOpen={dedicatedDiceRollerOpen}
          onClose={() => setDedicatedDiceRollerOpen(false)}
          character={character}
          gameId={activeGameId}
          rollPrivacy={rollPrivacy}
        />
      )}

      {!readOnly && (
        <>
          <InitiativeRollModal
            isOpen={initiativeRollOpen}
            onClose={() => setInitiativeRollOpen(false)}
            character={character}
            gameDetails={initiativeGameDetails}
            onRegistered={async () => {
              await refetchInitiativeGames();
              if (mutate) await mutate();
            }}
            onNavigateToShowOrder={(gameId) => {
              setInitiativeRollOpen(false);
              setInitiativeOrderInitialGameId(gameId);
              setInitiativeOrderOpen(true);
            }}
          />
          <InitiativeOrderModal
            isOpen={initiativeOrderOpen}
            onClose={() => {
              setInitiativeOrderOpen(false);
              setInitiativeOrderInitialGameId(null);
            }}
            gameDetails={initiativeGameDetails}
            initialGameId={initiativeOrderInitialGameId}
          />
        </>
      )}
    </div>
  );
}
