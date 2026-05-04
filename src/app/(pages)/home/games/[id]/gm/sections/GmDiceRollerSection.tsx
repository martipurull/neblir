"use client";

import Button from "@/app/components/shared/Button";
import InfoCard from "@/app/components/shared/InfoCard";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import { useGeneralDiceRollerState } from "@/hooks/use-general-dice-roller";
import { useCallback, useState } from "react";
import { GmSectionTitle } from "./GmSectionTitle";

type GmDiceRollerSectionProps = {
  gameId: string;
};

export function GmDiceRollerSection({ gameId }: GmDiceRollerSectionProps) {
  const [rolling, setRolling] = useState(false);
  const {
    COMMON_DICE_OPTIONS,
    diceCount,
    diceType,
    diceTypeMode,
    advancedDiceOption,
    customSides,
    note,
    setNote,
    rollResult,
    canRoll,
    setDiceTypeAndClearResult,
    decreaseDiceCount,
    increaseDiceCount,
    applyDiceCountFromInput,
    handleAdvancedDiceOptionChange,
    handleEnableAdvancedDice,
    handleReturnToQuickDice,
    adjustCustomSidesBy,
    applyCustomSidesFromInput,
    tryExecuteRoll,
  } = useGeneralDiceRollerState();

  const handleRoll = useCallback(() => {
    setRolling(true);
    const roll = tryExecuteRoll();
    if (!roll) {
      setRolling(false);
      return;
    }
    const cleanNote = note.trim();
    void emitRollEvent(gameId, {
      rollType: "GENERAL_ROLL",
      diceExpression: roll.diceExpression,
      results: roll.results,
      total: roll.total,
      metadata: cleanNote.length > 0 ? { note: cleanNote } : undefined,
    }).finally(() => {
      setRolling(false);
    });
  }, [tryExecuteRoll, gameId, note]);

  return (
    <InfoCard border>
      <GmSectionTitle>Dice Roller</GmSectionTitle>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-semibold text-black">
          Number of dice
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="modalIconStepper"
              fullWidth={false}
              onClick={decreaseDiceCount}
              aria-label="Decrease number of dice"
            >
              -
            </Button>
            <input
              type="number"
              min={1}
              step={1}
              value={diceCount}
              onChange={(event) => {
                applyDiceCountFromInput(event.target.value);
              }}
              className="min-h-11 w-20 rounded-md border border-black/20 bg-paleBlue px-3 py-2 text-center text-black placeholder:text-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimaryHover"
            />
            <Button
              type="button"
              variant="modalIconStepper"
              fullWidth={false}
              onClick={increaseDiceCount}
              aria-label="Increase number of dice"
            >
              +
            </Button>
          </div>
        </label>

        <div className="flex flex-col gap-2 text-sm font-semibold text-black">
          <span>Type of dice (sides)</span>
          {diceTypeMode === "quick" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={diceType === 10 ? "primarySm" : "secondaryOutlineXs"}
                fullWidth={false}
                onClick={() => setDiceTypeAndClearResult(10)}
              >
                d10
              </Button>
              <Button
                type="button"
                variant={diceType === 6 ? "primarySm" : "secondaryOutlineXs"}
                fullWidth={false}
                onClick={() => setDiceTypeAndClearResult(6)}
              >
                d6
              </Button>
              <Button
                type="button"
                variant="secondaryOutlineXs"
                fullWidth={false}
                onClick={handleEnableAdvancedDice}
              >
                Other dice...
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <SelectDropdown
                id="gm-dice-sides-select"
                label="Dice sides"
                showLabel={false}
                placeholder="Choose dice type"
                value={advancedDiceOption}
                options={[...COMMON_DICE_OPTIONS]}
                onChange={handleAdvancedDiceOptionChange}
                pinValueFirst="d10"
              />

              {advancedDiceOption === "custom" ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="modalIconStepper"
                    fullWidth={false}
                    onClick={() => adjustCustomSidesBy(-1)}
                    aria-label="Decrease custom dice sides"
                  >
                    -
                  </Button>
                  <input
                    type="number"
                    min={2}
                    step={1}
                    value={customSides}
                    onChange={(event) => {
                      applyCustomSidesFromInput(event.target.value);
                    }}
                    className="min-h-11 w-24 rounded-md border border-black/20 bg-paleBlue px-3 py-2 text-center text-black placeholder:text-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimaryHover"
                  />
                  <Button
                    type="button"
                    variant="modalIconStepper"
                    fullWidth={false}
                    onClick={() => adjustCustomSidesBy(1)}
                    aria-label="Increase custom dice sides"
                  >
                    +
                  </Button>
                  <span className="text-xs text-black/70">custom sides</span>
                </div>
              ) : null}

              <Button
                type="button"
                variant="secondaryOutlineXs"
                fullWidth={false}
                onClick={handleReturnToQuickDice}
              >
                Back to d10/d6 quick toggle
              </Button>
            </div>
          )}
        </div>
      </div>

      <label className="mt-3 flex flex-col gap-1 text-sm font-semibold text-black">
        Note (optional)
        <input
          type="text"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. Secret Roll"
          className="min-h-11 rounded-md border border-black/20 bg-paleBlue px-3 py-2 text-black placeholder:text-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimaryHover"
        />
      </label>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-black/80">
          Rolling: {diceCount}d{diceType}
        </p>
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          disabled={!canRoll || rolling}
          onClick={handleRoll}
        >
          Roll
        </Button>
      </div>

      {!canRoll ? (
        <p className="mt-2 text-xs text-black/70">
          Enter valid values: dice count at least 1 and dice sides at least 2.
        </p>
      ) : null}

      {rollResult ? (
        <div className="mt-3 rounded border border-black/20 bg-paleBlue/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-black/70">
            Result
          </p>
          <p className="mt-1 text-sm text-black">
            [{rollResult.join(", ")}] - Total:{" "}
            {rollResult.reduce((sum, value) => sum + value, 0)}
          </p>
        </div>
      ) : null}
    </InfoCard>
  );
}
