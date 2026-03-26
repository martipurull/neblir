// eslint-disable-next-line no-unused-expressions
"use client";

import React, { useCallback, useEffect, useState } from "react";

export interface DefenceRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Number of d10 attack dice to roll (defence mod). */
  defenceDice: number;
  /** Title shown in the modal (e.g. "Melee Defence"). */
  title: string;
  /** When true, consuming a reaction is not possible and the roll button is disabled. */
  reactionDisabled?: boolean;
  /** Called when the user actually presses ROLL (consumes exactly one reaction). */
  onRollReaction?: () => void | Promise<void>;
}

function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

export function DefenceRollModal({
  isOpen,
  onClose,
  defenceDice,
  title,
  reactionDisabled = false,
  onRollReaction,
}: DefenceRollModalProps) {
  const [extraDice, setExtraDice] = useState(0);
  const [rollResult, setRollResult] = useState<number[] | null>(null);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setExtraDice(0);
      setRollResult(null);
      setRolling(false);
    }
  }, [isOpen]);

  const totalDice = Math.max(0, defenceDice + extraDice);

  const handleRoll = useCallback(async () => {
    if (reactionDisabled || rolling) return;
    setRolling(true);
    try {
      if (onRollReaction) {
        await onRollReaction();
      }

      const results = Array.from({ length: totalDice }, () => rollD10());
      results.sort((a, b) => b - a);
      setRollResult(results);
    } finally {
      setRolling(false);
    }
  }, [reactionDisabled, rolling, onRollReaction, totalDice]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="defence-roll-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border-2 border-white bg-modalBackground-200 p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            id="defence-roll-modal-title"
            className="text-lg font-semibold text-white"
          >
            {title} roll
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white transition-colors hover:bg-white/10"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-white">Extra dice</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExtraDice((d) => d - 1)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-white bg-transparent text-lg font-bold text-white transition-colors hover:bg-white/10"
                aria-label="Decrease extra dice"
              >
                −
              </button>
              <span className="min-w-[2.5rem] text-center text-sm font-bold text-white">
                {extraDice >= 0 ? `+${extraDice}` : extraDice}
              </span>
              <button
                type="button"
                onClick={() => setExtraDice((d) => d + 1)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-white bg-transparent text-lg font-bold text-white transition-colors hover:bg-white/10"
                aria-label="Increase extra dice"
              >
                +
              </button>
            </div>
          </div>

          <p className="text-sm font-medium text-white">
            Base: {defenceDice} d10
          </p>
          <p className="text-sm font-medium text-white">
            Total: {totalDice} d10{totalDice !== 1 ? "s" : ""}
          </p>

          {rollResult !== null && (
            <div className="rounded border border-white/30 bg-black/20 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/80">
                Result
              </p>
              <p className="flex flex-wrap gap-x-2 gap-y-0.5 text-lg tabular-nums text-white">
                {rollResult.map((value, i) => {
                  const isSuccess = value >= 8;
                  const isTen = value === 10;
                  const isOne = value === 1;
                  const colorClass = isSuccess
                    ? "text-neblirSafe-600"
                    : isOne
                      ? "text-neblirDanger-400"
                      : "";
                  const boldClass = isTen ? "font-bold" : "";
                  const spanClass = [colorClass, boldClass]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <span key={i} className={spanClass || undefined}>
                      {value}
                      {i < rollResult.length - 1 ? ", " : ""}
                    </span>
                  );
                })}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => void handleRoll()}
              disabled={reactionDisabled || totalDice === 0}
              className="flex-1 rounded-md border-2 border-white bg-white py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white"
            >
              ROLL
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border-2 border-white bg-transparent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
