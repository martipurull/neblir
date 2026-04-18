"use client";

import {
  decodeDiceSelectionItem,
  diceItemsToDropdownOptions,
  filterSecondStatChoices,
  isValidDiceRollPair,
  listAllDiceSelectionItems,
} from "@/app/lib/dice-selection-catalog";
import { getDiceLabel, getDiceValue } from "@/app/lib/dice-roll-utils";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import type { CharacterDetail } from "@/app/lib/types/character";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import React, { useCallback, useEffect, useMemo, useState } from "react";

function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

export interface DedicatedDiceRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterDetail;
  gameId?: string | null;
}

export function DedicatedDiceRollModal({
  isOpen,
  onClose,
  character,
  gameId,
}: DedicatedDiceRollModalProps) {
  const [firstValue, setFirstValue] = useState("");
  const [secondValue, setSecondValue] = useState("");
  const [extraDice, setExtraDice] = useState(0);
  const [rollResult, setRollResult] = useState<number[] | null>(null);

  const allItems = useMemo(
    () => listAllDiceSelectionItems(character),
    [character]
  );

  const firstOption = useMemo(
    () => decodeDiceSelectionItem(firstValue),
    [firstValue]
  );
  const secondOption = useMemo(
    () => decodeDiceSelectionItem(secondValue),
    [secondValue]
  );

  const firstDropdownOptions = useMemo(
    () => diceItemsToDropdownOptions(character, allItems),
    [character, allItems]
  );

  const secondChoices = useMemo(() => {
    if (!firstOption) return [];
    return filterSecondStatChoices(firstOption, allItems);
  }, [firstOption, allItems]);

  const secondDropdownOptions = useMemo(
    () => diceItemsToDropdownOptions(character, secondChoices),
    [character, secondChoices]
  );

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setFirstValue("");
      setSecondValue("");
      setExtraDice(0);
      setRollResult(null);
    });
  }, [isOpen]);

  const handleFirstChange = useCallback(
    (v: string) => {
      setFirstValue(v);
      setRollResult(null);
      const nextFirst = decodeDiceSelectionItem(v);
      if (!nextFirst) {
        setSecondValue("");
        return;
      }
      const currentSecond = decodeDiceSelectionItem(secondValue);
      if (currentSecond && !isValidDiceRollPair(nextFirst, currentSecond)) {
        setSecondValue("");
      }
    },
    [secondValue]
  );

  const pairReady =
    firstOption &&
    secondOption &&
    isValidDiceRollPair(firstOption, secondOption);

  const v1 = pairReady ? getDiceValue(character, firstOption) : 0;
  const v2 = pairReady ? getDiceValue(character, secondOption) : 0;
  const label1 = pairReady ? getDiceLabel(character, firstOption) : "";
  const label2 = pairReady ? getDiceLabel(character, secondOption) : "";
  const baseDice = pairReady ? v1 + v2 : 0;
  const totalDice = Math.max(0, baseDice + extraDice);

  const handleRoll = useCallback(() => {
    if (!pairReady || !firstOption || !secondOption) return;
    const count = Math.max(0, baseDice + extraDice);
    if (count === 0) return;
    const results = Array.from({ length: count }, () => rollD10());
    results.sort((a, b) => b - a);
    setRollResult(results);
    void emitRollEvent(gameId, {
      characterId: character.id,
      rollType: "GENERAL_ROLL",
      diceExpression: `${count}d10`,
      results,
      metadata: {
        label1,
        label2,
        baseDice,
        extraDice,
      },
    });
  }, [
    pairReady,
    firstOption,
    secondOption,
    baseDice,
    extraDice,
    gameId,
    character.id,
    label1,
    label2,
  ]);

  const validationHint = useMemo(() => {
    if (!firstValue || !secondValue) {
      return "Select a first stat, then a second stat (two attributes, or one attribute and one skill — not two skills).";
    }
    if (
      firstOption &&
      secondOption &&
      !isValidDiceRollPair(firstOption, secondOption)
    ) {
      return "You cannot pair two general skills. Choose two attributes or one attribute and one skill.";
    }
    return null;
  }, [firstValue, secondValue, firstOption, secondOption]);

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title="Dice roller"
      titleId="dedicated-dice-roll-modal-title"
      subtitle="Search by name, then roll with two stats (or an attribute and a skill)."
      maxWidthClass="max-w-md"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRoll}
            disabled={!pairReady || totalDice === 0}
            className="flex-1 rounded-md border-2 border-white bg-paleBlue py-2.5 text-sm font-semibold text-black transition-colors hover:bg-paleBlue/90 disabled:opacity-50 disabled:hover:bg-paleBlue"
          >
            Roll
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
      <div className="space-y-5">
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-sm font-bold text-white">First stat</p>
            <SelectDropdown
              id="dedicated-roll-stat-1"
              label="First stat"
              showLabel={false}
              placeholder="Choose attribute or skill…"
              value={firstValue}
              options={firstDropdownOptions}
              onChange={handleFirstChange}
            />
          </div>
          <div
            className={
              !firstOption ? "pointer-events-none opacity-50" : undefined
            }
          >
            <p className="mb-1 text-sm font-bold text-white">Second stat</p>
            <SelectDropdown
              id="dedicated-roll-stat-2"
              label="Second stat"
              showLabel={false}
              placeholder={
                firstOption ? "Choose second stat…" : "Choose first stat first…"
              }
              value={secondValue}
              options={secondDropdownOptions}
              disabled={!firstOption}
              onChange={(v) => {
                setSecondValue(v);
                setRollResult(null);
              }}
            />
          </div>
        </div>

        {validationHint ? (
          <p className="text-xs text-white/75">{validationHint}</p>
        ) : null}

        {pairReady ? (
          <p className="text-sm text-white/90">
            {label1} ({v1}) + {label2} ({v2}) = {baseDice} dice
          </p>
        ) : null}

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
