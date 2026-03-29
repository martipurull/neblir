// eslint-disable-next-line no-unused-expressions
"use client";

import React from "react";

export interface UseReactionDisplayParams {
  reactionsPerRound: number;
  usedReactions: number;
  onUseReaction?: () => void;
}

export interface UseReactionDisplayResult {
  value: React.ReactNode;
  disabled: boolean;
}

export function useReactionDisplay({
  reactionsPerRound: maxReactions,
  usedReactions,
  onUseReaction,
}: UseReactionDisplayParams): UseReactionDisplayResult {
  const isTrackingReactions = onUseReaction != null;
  const disabled = isTrackingReactions && usedReactions >= maxReactions;

  const value: React.ReactNode = isTrackingReactions ? (
    <span className="mt-1 flex flex-wrap items-center justify-center gap-1">
      {Array.from({ length: maxReactions }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 shrink-0 rounded-sm border border-black ${i < usedReactions ? "bg-black" : "bg-transparent"}`}
          aria-hidden
        />
      ))}
    </span>
  ) : (
    maxReactions
  );

  return { value, disabled };
}
