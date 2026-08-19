"use client";

import type { CharacterDetail } from "@/app/lib/types/character";
import { updateCharacterCombatInfo } from "@/lib/api/character";
import { useCallback, useLayoutEffect, useRef } from "react";
import type { KeyedMutator } from "swr";

/**
 * Optimistic reaction spend/reset persisted via PATCH combat-info.
 * Display still uses "used" dots (max - remaining) for the existing UI.
 */
export function useReactionTracking(
  character: CharacterDetail | null,
  mutate: KeyedMutator<CharacterDetail | null>
) {
  /** Latest character for rapid optimistic clicks; synced outside render. */
  const characterRef = useRef(character);
  useLayoutEffect(() => {
    characterRef.current = character;
  }, [character]);

  const maxReactions = character?.combatInformation?.reactionsPerRound ?? 0;
  const remaining = character?.combatInformation?.reactionsRemaining ?? 0;
  const usedReactions = Math.max(0, maxReactions - remaining);

  const persistRemaining = useCallback(
    async (nextRemaining: number) => {
      const cur = characterRef.current;
      if (!cur?.combatInformation || !cur.id) return;
      const capped = Math.max(
        0,
        Math.min(nextRemaining, cur.combatInformation.reactionsPerRound)
      );
      const nextCharacter: CharacterDetail = {
        ...cur,
        combatInformation: {
          ...cur.combatInformation,
          reactionsRemaining: capped,
        },
      };
      characterRef.current = nextCharacter;
      void mutate(nextCharacter, false);
      try {
        const updated = await updateCharacterCombatInfo(cur.id, {
          reactionsRemaining: capped,
        });
        characterRef.current = updated;
        await mutate(updated, false);
      } catch {
        await mutate();
      }
    },
    [mutate]
  );

  const useReaction = useCallback(() => {
    const cur = characterRef.current;
    if (!cur?.combatInformation) return;
    const currentRemaining = cur.combatInformation.reactionsRemaining;
    if (currentRemaining <= 0) return;
    void persistRemaining(currentRemaining - 1);
  }, [persistRemaining]);

  const clearReactions = useCallback(() => {
    const cur = characterRef.current;
    if (!cur?.combatInformation) return;
    void persistRemaining(cur.combatInformation.reactionsPerRound);
  }, [persistRemaining]);

  const isDisabled = usedReactions >= maxReactions;

  return {
    usedReactions,
    useReaction,
    clearReactions,
    isDisabled,
  };
}
