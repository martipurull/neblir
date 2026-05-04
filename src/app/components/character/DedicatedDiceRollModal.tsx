"use client";

import {
  decodeDiceSelectionItem,
  diceItemsToDropdownOptions,
  filterSecondStatChoices,
  isValidDiceRollPair,
  listAllDiceSelectionItems,
} from "@/app/lib/dice-selection-catalog";
import { getDiceLabel, getDiceValue } from "@/app/lib/dice-roll-utils";
import {
  DAMAGE_DICE_OPTIONS,
  DAMAGE_TYPE_OPTIONS,
} from "@/app/lib/damage-roll-dropdown-options";
import { getSidesFromDieOption, rollDie } from "@/app/lib/general-dice";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import type { CharacterDetail } from "@/app/lib/types/character";
import type { WeaponDamageType } from "@/app/lib/types/item";
import Button from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { useGeneralDiceRollerState } from "@/hooks/use-general-dice-roller";
import { useCallback, useEffect, useMemo, useState } from "react";

type TabId = "stats" | "damage" | "free";

function rollD10() {
  return Math.floor(Math.random() * 10) + 1;
}

function ResultBlock({ values }: { values: number[] }) {
  return (
    <div className="rounded border border-white/30 bg-black/20 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/80">
        Result
      </p>
      <p className="flex flex-wrap gap-x-2 gap-y-0.5 text-lg tabular-nums text-white">
        {values.map((value, i) => (
          <span key={i}>
            {value}
            {i < values.length - 1 ? ", " : ""}
          </span>
        ))}
      </p>
      <p className="mt-2 text-sm text-white/85">
        Total: {values.reduce((sum, value) => sum + value, 0)}
      </p>
    </div>
  );
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
  const [tab, setTab] = useState<TabId>("stats");
  const [firstValue, setFirstValue] = useState("");
  const [secondValue, setSecondValue] = useState("");
  const [extraDice, setExtraDice] = useState(0);
  const [statsResult, setStatsResult] = useState<number[] | null>(null);
  const [damageDiceCount, setDamageDiceCount] = useState(1);
  const [damageDiceType, setDamageDiceType] = useState(6);
  const [damageType, setDamageType] = useState<WeaponDamageType>("OTHER");
  const [damageResult, setDamageResult] = useState<number[] | null>(null);
  const {
    COMMON_DICE_OPTIONS,
    diceCount: freeDiceCount,
    diceType: freeDiceType,
    diceTypeMode: freeDiceTypeMode,
    advancedDiceOption: freeAdvancedDiceOption,
    customSides: freeCustomSides,
    note: freeNote,
    setNote: setFreeNote,
    rollResult: freeResult,
    canRoll: freeCanRoll,
    reset: resetFreeDice,
    setDiceTypeAndClearResult: setFreeDiceTypeAndClearResult,
    decreaseDiceCount: decreaseFreeDiceCount,
    increaseDiceCount: increaseFreeDiceCount,
    handleAdvancedDiceOptionChange: handleFreeAdvancedDiceOptionChange,
    handleEnableAdvancedDice: handleEnableFreeAdvancedDice,
    handleReturnToQuickDice: handleReturnToFreeQuickDice,
    applyCustomSidesFromInput: applyFreeCustomSidesFromInput,
    tryExecuteRoll: tryExecuteFreeRoll,
  } = useGeneralDiceRollerState();

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
      setTab("stats");
      setFirstValue("");
      setSecondValue("");
      setExtraDice(0);
      setStatsResult(null);
      setDamageDiceCount(1);
      setDamageDiceType(6);
      setDamageType("OTHER");
      setDamageResult(null);
      resetFreeDice();
    });
  }, [isOpen, resetFreeDice]);

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
  const validationHint = useMemo(() => {
    if (!firstValue || !secondValue) {
      return "Select a first stat, then a second stat (two attributes, or one attribute and one skill - not two skills).";
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

  const handleStatsRoll = useCallback(() => {
    if (!pairReady || !firstOption || !secondOption || totalDice <= 0) return;
    const results = Array.from({ length: totalDice }, () => rollD10()).sort(
      (a, b) => b - a
    );
    setStatsResult(results);
    void emitRollEvent(gameId, {
      characterId: character.id,
      rollType: "GENERAL_ROLL",
      diceExpression: `${totalDice}d10`,
      results,
      metadata: { label1, label2, baseDice, extraDice },
    });
  }, [
    pairReady,
    firstOption,
    secondOption,
    totalDice,
    gameId,
    character.id,
    label1,
    label2,
    baseDice,
    extraDice,
  ]);

  const handleDamageRoll = useCallback(() => {
    if (damageDiceCount <= 0 || damageDiceType <= 1) return;
    const results = Array.from({ length: damageDiceCount }, () =>
      rollDie(damageDiceType)
    ).sort((a, b) => b - a);
    setDamageResult(results);
    void emitRollEvent(gameId, {
      characterId: character.id,
      rollType: "ATTACK_DAMAGE",
      diceExpression: `${damageDiceCount}d${damageDiceType}`,
      results,
      total: results.reduce((sum, value) => sum + value, 0),
      metadata: { source: "dedicatedDiceRollModal", damageType },
    });
  }, [damageDiceCount, damageDiceType, gameId, character.id, damageType]);

  const handleFreeRoll = useCallback(() => {
    const roll = tryExecuteFreeRoll();
    if (!roll) return;
    const note = freeNote.trim();
    void emitRollEvent(gameId, {
      characterId: character.id,
      rollType: "GENERAL_ROLL",
      diceExpression: roll.diceExpression,
      results: roll.results,
      total: roll.total,
      metadata: note ? { note } : undefined,
    });
  }, [tryExecuteFreeRoll, freeNote, gameId, character.id]);

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title="Dice roller"
      titleId="dedicated-dice-roll-modal-title"
      subtitle="Stats, damage, and free roll."
      maxWidthClass="max-w-md"
      panelClassName="min-h-[min(58vh,28rem)]"
      footer={
        <Button type="button" variant="modalFooterSecondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={
              tab === "stats" ? "modalOptionSelected" : "modalOptionUnselected"
            }
            onClick={() => setTab("stats")}
          >
            Stats
          </Button>
          <Button
            type="button"
            variant={
              tab === "damage" ? "modalOptionSelected" : "modalOptionUnselected"
            }
            onClick={() => setTab("damage")}
          >
            Damage
          </Button>
          <Button
            type="button"
            variant={
              tab === "free" ? "modalOptionSelected" : "modalOptionUnselected"
            }
            onClick={() => setTab("free")}
          >
            Free
          </Button>
        </div>

        {tab === "stats" && (
          <div className="space-y-4">
            <SelectDropdown
              id="dedicated-roll-stat-1"
              label="First stat"
              showLabel={false}
              placeholder="Choose first stat..."
              value={firstValue}
              options={firstDropdownOptions}
              onChange={(v) => {
                setFirstValue(v);
                setStatsResult(null);
                const nextFirst = decodeDiceSelectionItem(v);
                if (!nextFirst) {
                  setSecondValue("");
                  return;
                }
                const currentSecond = decodeDiceSelectionItem(secondValue);
                if (
                  currentSecond &&
                  !isValidDiceRollPair(nextFirst, currentSecond)
                ) {
                  setSecondValue("");
                }
              }}
            />
            <SelectDropdown
              id="dedicated-roll-stat-2"
              label="Second stat"
              showLabel={false}
              placeholder="Choose second stat..."
              value={secondValue}
              options={secondDropdownOptions}
              disabled={!firstOption}
              onChange={(v) => {
                setSecondValue(v);
                setStatsResult(null);
              }}
            />
            {pairReady ? (
              <p className="text-sm text-white/90">
                {label1} ({v1}) + {label2} ({v2}) = {baseDice} dice
              </p>
            ) : null}
            {validationHint ? (
              <p className="text-xs text-white/75">{validationHint}</p>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-white">Extra dice</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="modalIconStepper"
                  fullWidth={false}
                  onClick={() => setExtraDice((d) => d - 1)}
                >
                  -
                </Button>
                <span className="min-w-[2.5rem] text-center text-white">
                  {extraDice >= 0 ? `+${extraDice}` : extraDice}
                </span>
                <Button
                  type="button"
                  variant="modalIconStepper"
                  fullWidth={false}
                  onClick={() => setExtraDice((d) => d + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            <Button
              type="button"
              variant="modalBlockPrimary"
              onClick={handleStatsRoll}
              disabled={!pairReady || totalDice === 0}
            >
              Roll stats
            </Button>
            {statsResult ? <ResultBlock values={statsResult} /> : null}
          </div>
        )}

        {tab === "damage" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm text-white">Number of dice</span>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="modalIconStepper"
                    fullWidth={false}
                    onClick={() => {
                      setDamageDiceCount((d) => Math.max(1, d - 1));
                      setDamageResult(null);
                    }}
                  >
                    -
                  </Button>
                  <span className="min-w-[2.5rem] text-center text-sm font-bold text-white">
                    {damageDiceCount}
                  </span>
                  <Button
                    type="button"
                    variant="modalIconStepper"
                    fullWidth={false}
                    onClick={() => {
                      setDamageDiceCount((d) => d + 1);
                      setDamageResult(null);
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectDropdown
                id="dedicated-damage-dice-sides"
                label="Sides"
                showLabel
                placeholder="Choose die"
                value={`d${damageDiceType}`}
                options={DAMAGE_DICE_OPTIONS}
                onChange={(value) => {
                  const sides = getSidesFromDieOption(value);
                  if (!sides) return;
                  setDamageDiceType(sides);
                  setDamageResult(null);
                }}
              />
              <SelectDropdown
                id="dedicated-damage-type"
                label="Damage type"
                showLabel
                placeholder="Choose damage type"
                value={damageType}
                options={DAMAGE_TYPE_OPTIONS}
                onChange={(value) => setDamageType(value as WeaponDamageType)}
                menuMaxHeightClass="max-h-[min(50vh,16rem)]"
              />
            </div>
            <Button
              type="button"
              variant="modalBlockPrimary"
              onClick={handleDamageRoll}
              disabled={damageDiceCount <= 0 || damageDiceType <= 1}
            >
              Roll damage
            </Button>
            {damageResult ? <ResultBlock values={damageResult} /> : null}
          </div>
        )}

        {tab === "free" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm text-white">Number of dice</span>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="modalIconStepper"
                    fullWidth={false}
                    onClick={decreaseFreeDiceCount}
                  >
                    -
                  </Button>
                  <span className="min-w-[2.5rem] text-center text-sm font-bold text-white">
                    {freeDiceCount}
                  </span>
                  <Button
                    type="button"
                    variant="modalIconStepper"
                    fullWidth={false}
                    onClick={increaseFreeDiceCount}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm text-white">Sides</span>
              {freeDiceTypeMode === "quick" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant={
                      freeDiceType === 10
                        ? "modalOptionSelected"
                        : "modalOptionUnselected"
                    }
                    fullWidth={false}
                    onClick={() => setFreeDiceTypeAndClearResult(10)}
                  >
                    d10
                  </Button>
                  <Button
                    type="button"
                    variant={
                      freeDiceType === 6
                        ? "modalOptionSelected"
                        : "modalOptionUnselected"
                    }
                    fullWidth={false}
                    onClick={() => setFreeDiceTypeAndClearResult(6)}
                  >
                    d6
                  </Button>
                  <Button
                    type="button"
                    variant="modalOptionUnselected"
                    fullWidth={false}
                    onClick={handleEnableFreeAdvancedDice}
                  >
                    Other dice...
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <SelectDropdown
                    id="character-free-roll-dice-sides"
                    label="Dice sides"
                    showLabel={false}
                    placeholder="Choose dice type"
                    value={freeAdvancedDiceOption}
                    options={[...COMMON_DICE_OPTIONS]}
                    onChange={handleFreeAdvancedDiceOptionChange}
                    pinValueFirst="d10"
                  />

                  {freeAdvancedDiceOption === "custom" ? (
                    <label className="text-sm text-white">
                      Custom sides
                      <input
                        type="number"
                        min={2}
                        value={freeCustomSides}
                        onChange={(e) => {
                          applyFreeCustomSidesFromInput(e.target.value);
                        }}
                        className="mt-1 min-h-11 w-full rounded-md border border-white/30 bg-black/20 px-3 py-2 text-white"
                      />
                    </label>
                  ) : null}

                  <Button
                    type="button"
                    variant="modalOptionUnselected"
                    fullWidth={false}
                    onClick={handleReturnToFreeQuickDice}
                  >
                    Back to d10/d6 quick toggle
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-white">
                Rolling
                <p className="mt-1 min-h-11 rounded-md border border-white/30 bg-black/20 px-3 py-2 text-white">
                  {freeDiceCount}d{freeDiceType}
                </p>
              </label>
            </div>
            <label className="text-sm text-white">
              Note (optional)
              <input
                type="text"
                value={freeNote}
                onChange={(e) => setFreeNote(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-md border border-white/30 bg-black/20 px-3 py-2 text-white"
                placeholder="e.g. Secret Roll"
              />
            </label>
            <Button
              type="button"
              variant="modalBlockPrimary"
              onClick={handleFreeRoll}
              disabled={!freeCanRoll}
            >
              Roll
            </Button>
            {freeResult ? <ResultBlock values={freeResult} /> : null}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
