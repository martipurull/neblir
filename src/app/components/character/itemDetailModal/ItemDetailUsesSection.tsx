"use client";

import React from "react";

type ItemDetailUsesSectionProps = {
  displayUses: number;
  maxUses: number;
  onDelta: (delta: number) => void;
};

export function ItemDetailUsesSection({
  displayUses,
  maxUses,
  onDelta,
}: ItemDetailUsesSectionProps) {
  return (
    <div className="mt-3 flex flex-col gap-2 rounded border border-white/20 p-3">
      <span className="block text-xs font-medium uppercase tracking-wider text-white/70">
        Uses
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onDelta(-1)}
          disabled={displayUses <= 0}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-white bg-transparent text-lg font-bold text-white transition-colors hover:bg-paleBlue/10 disabled:opacity-50 disabled:hover:bg-transparent"
          aria-label="Decrease uses"
        >
          −
        </button>
        <span className="min-w-[4rem] text-center text-lg font-semibold tabular-nums text-white">
          {displayUses} / {maxUses}
        </span>
        <button
          type="button"
          onClick={() => onDelta(1)}
          disabled={displayUses >= maxUses}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-white bg-transparent text-lg font-bold text-white transition-colors hover:bg-paleBlue/10 disabled:opacity-50 disabled:hover:bg-transparent"
          aria-label="Increase uses"
        >
          +
        </button>
      </div>
      <p className="text-xs text-white/60">
        Changes save automatically after a short delay.
      </p>
    </div>
  );
}
