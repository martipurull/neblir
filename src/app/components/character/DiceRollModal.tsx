"use client";

import { getDiceLabel, getDiceValue } from "@/app/lib/dice-roll-utils";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import type { CharacterDetail } from "@/app/lib/types/character";
import type { DiceSelectionItem } from "@/app/lib/types/dice-roll";
import { ModalShell } from "@/app/components/shared/ModalShell";
import React, { useCallback, useEffect, useState } from "react";

export interface DiceRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterDetail;
  gameId?: string | null;
  selection: [DiceSelectionItem, DiceSelectionItem];
}

function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

export function DiceRollModal({
  isOpen,
  onClose,
  character,
  gameId,
  selection,
}: DiceRollModalProps) {
  const [extraDice, setExtraDice] = useState(0);
  const [rollResult, setRollResult] = useState<number[] | null>(null);

  const v1 = getDiceValue(character, selection[0]);
  const v2 = getDiceValue(character, selection[1]);
  const label1 = getDiceLabel(character, selection[0]);
  const label2 = getDiceLabel(character, selection[1]);
  const baseDice = v1 + v2;
  const totalDice = Math.max(0, baseDice + extraDice);

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setExtraDice(0);
      setRollResult(null);
    });
  }, [isOpen]);

  const handleRoll = useCallback(() => {
    const count = Math.max(0, baseDice + extraDice);
    const results = Array.from({ length: count }, () => rollD10());
    results.sort((a, b) => b - a);
    setRollResult(results);
    void emitRollEvent(gameId, {
      characterId: character.id,
      rollType: "GENERAL_ROLL",
      diceExpression: `${count}d10`,
      results,
      metadata: { label1, label2, baseDice, extraDice },
    });
  }, [baseDice, extraDice, gameId, character.id, label1, label2]);

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title="Roll d10s"
      titleId="dice-roll-modal-title"
      maxWidthClass="max-w-sm"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRoll}
            className="flex-1 rounded-md border-2 border-white bg-paleBlue py-2.5 text-sm font-semibold text-black transition-colors hover:bg-paleBlue/90"
          >
            ROLL
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-md border-2 border-white bg-transparent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-paleBlue/10"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-white/90">
          {label1} ({v1}) + {label2} ({v2}) = {baseDice} dice
        </p>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-white">Extra dice</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExtraDice((d) => d - 1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-white bg-transparent text-lg font-bold text-white transition-colors hover:bg-paleBlue/10"
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-white bg-transparent text-lg font-bold text-white transition-colors hover:bg-paleBlue/10"
              aria-label="Increase extra dice"
            >
              +
            </button>
          </div>
        </div>

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
      </div>
    </ModalShell>
  );
}
