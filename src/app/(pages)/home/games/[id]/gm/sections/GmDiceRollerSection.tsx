"use client";

import Button from "@/app/components/shared/Button";
import InfoCard from "@/app/components/shared/InfoCard";
import {
  SelectDropdown,
  type SelectDropdownOption,
} from "@/app/components/shared/SelectDropdown";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import { useCallback, useState } from "react";
import { GmSectionTitle } from "./GmSectionTitle";

type GmDiceRollerSectionProps = {
  gameId: string;
};

const COMMON_DICE_OPTIONS: SelectDropdownOption[] = [
  { value: "d4", label: "d4" },
  { value: "d6", label: "d6" },
  { value: "d8", label: "d8" },
  { value: "d10", label: "d10" },
  { value: "d20", label: "d20" },
  { value: "d100", label: "d100" },
  { value: "custom", label: "Any sides (custom)" },
];

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function getSidesFromDieOption(value: string): number | null {
  if (!value.startsWith("d")) return null;
  const parsed = Number.parseInt(value.slice(1), 10);
  if (!Number.isInteger(parsed) || parsed < 2) return null;
  return parsed;
}

export function GmDiceRollerSection({ gameId }: GmDiceRollerSectionProps) {
  const [diceCount, setDiceCount] = useState(1);
  const [diceType, setDiceType] = useState(10);
  const [diceTypeMode, setDiceTypeMode] = useState<"quick" | "advanced">(
    "quick"
  );
  const [advancedDiceOption, setAdvancedDiceOption] = useState<string>("d10");
  const [customSides, setCustomSides] = useState(10);
  const [note, setNote] = useState("");
  const [rollResult, setRollResult] = useState<number[] | null>(null);
  const [rolling, setRolling] = useState(false);

  const canRoll =
    Number.isInteger(diceCount) &&
    Number.isInteger(diceType) &&
    diceCount > 0 &&
    diceType > 1;

  const setDiceTypeAndClearResult = (nextSides: number) => {
    setDiceType(nextSides);
    setRollResult(null);
  };

  const decreaseDiceCount = () => {
    setDiceCount((current) => Math.max(1, current - 1));
    setRollResult(null);
  };
  const increaseDiceCount = () => {
    setDiceCount((current) => current + 1);
    setRollResult(null);
  };

  const handleAdvancedDiceOptionChange = (value: string) => {
    setAdvancedDiceOption(value);
    if (value === "custom") {
      const clamped = Math.max(2, customSides);
      setCustomSides(clamped);
      setDiceTypeAndClearResult(clamped);
      return;
    }
    const sides = getSidesFromDieOption(value);
    if (!sides) return;
    setDiceTypeAndClearResult(sides);
  };

  const handleEnableAdvancedDice = () => {
    setDiceTypeMode("advanced");
    const asCommonOption = `d${diceType}`;
    const isCommon = COMMON_DICE_OPTIONS.some(
      (o) => o.value === asCommonOption
    );
    if (isCommon) {
      setAdvancedDiceOption(asCommonOption);
      return;
    }
    setAdvancedDiceOption("custom");
    setCustomSides(Math.max(2, diceType));
  };

  const handleReturnToQuickDice = () => {
    setDiceTypeMode("quick");
    if (diceType === 6 || diceType === 10) return;
    setDiceTypeAndClearResult(10);
  };

  const handleRoll = useCallback(() => {
    if (!canRoll) return;
    setRolling(true);
    const results = Array.from({ length: diceCount }, () => rollDie(diceType));
    results.sort((a, b) => b - a);
    setRollResult(results);
    const total = results.reduce((sum, value) => sum + value, 0);
    const cleanNote = note.trim();
    void emitRollEvent(gameId, {
      rollType: "GENERAL_ROLL",
      diceExpression: `${diceCount}d${diceType}`,
      results,
      total,
      metadata: cleanNote.length > 0 ? { note: cleanNote } : undefined,
    }).finally(() => {
      setRolling(false);
    });
  }, [canRoll, diceCount, diceType, gameId, note]);

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
                setDiceCount(
                  Math.max(0, Math.trunc(Number(event.target.value) || 0))
                );
                setRollResult(null);
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
                options={COMMON_DICE_OPTIONS}
                onChange={handleAdvancedDiceOptionChange}
                pinValueFirst="d10"
              />

              {advancedDiceOption === "custom" ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="modalIconStepper"
                    fullWidth={false}
                    onClick={() => {
                      const next = Math.max(2, customSides - 1);
                      setCustomSides(next);
                      setDiceTypeAndClearResult(next);
                    }}
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
                      const next = Math.max(
                        0,
                        Math.trunc(Number(event.target.value) || 0)
                      );
                      setCustomSides(next);
                      setDiceTypeAndClearResult(next);
                    }}
                    className="min-h-11 w-24 rounded-md border border-black/20 bg-paleBlue px-3 py-2 text-center text-black placeholder:text-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimaryHover"
                  />
                  <Button
                    type="button"
                    variant="modalIconStepper"
                    fullWidth={false}
                    onClick={() => {
                      const next = customSides + 1;
                      setCustomSides(next);
                      setDiceTypeAndClearResult(next);
                    }}
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
