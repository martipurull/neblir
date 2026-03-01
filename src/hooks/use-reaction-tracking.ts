"use client";

import { useCallback, useState } from "react";

export function useReactionTracking(maxReactions: number) {
  const [usedReactions, setUsedReactions] = useState(0);

  const useReaction = useCallback(() => {
    setUsedReactions((prev) => Math.min(prev + 1, maxReactions));
  }, [maxReactions]);

  const clearReactions = useCallback(() => {
    setUsedReactions(0);
  }, []);

  const isDisabled = usedReactions >= maxReactions;

  return {
    usedReactions,
    useReaction,
    clearReactions,
    isDisabled,
  };
}
