"use client";

import {
  DAMAGE_DICE_OPTIONS,
  DAMAGE_TYPE_OPTIONS,
} from "@/app/lib/damage-roll-dropdown-options";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import { getSidesFromDieOption, rollDie } from "@/app/lib/general-dice";
import type { WeaponDamageType } from "@/app/lib/types/item";
import Button from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { useGeneralDiceRollerState } from "@/hooks/use-general-dice-roller";
import { useCallback, useEffect, useState } from "react";

type TabId = "damage" | "free";

export type EnemyInstanceDiceRollerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  enemyInstanceId: string;
  enemyName: string;
};

export function EnemyInstanceDiceRollerModal({
  isOpen,
  onClose,
  gameId,
  enemyInstanceId,
  enemyName,
}: EnemyInstanceDiceRollerModalProps) {
  const [tab, setTab] = useState<TabId>("free");
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

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setTab("free");
      setDamageDiceCount(1);
      setDamageDiceType(6);
      setDamageType("OTHER");
      setDamageResult(null);
      resetFreeDice();
    });
  }, [isOpen, resetFreeDice]);

  const handleDamageRoll = useCallback(() => {
    if (damageDiceCount <= 0 || damageDiceType <= 1) return;
    const results = Array.from({ length: damageDiceCount }, () =>
      rollDie(damageDiceType)
    ).sort((a, b) => b - a);
    setDamageResult(results);
    void emitRollEvent(gameId, {
      rollType: "ATTACK_DAMAGE",
      diceExpression: `${damageDiceCount}d${damageDiceType}`,
      results,
      total: results.reduce((sum, value) => sum + value, 0),
      metadata: {
        source: "enemyInstance",
        enemyInstanceId,
        enemyName,
        damageType,
        diceRoller: "enemyInstance",
      },
    });
  }, [
    damageDiceCount,
    damageDiceType,
    gameId,
    enemyInstanceId,
    enemyName,
    damageType,
  ]);

  const handleFreeRoll = useCallback(() => {
    const roll = tryExecuteFreeRoll();
    if (!roll) return;
    const note = freeNote.trim();
    void emitRollEvent(gameId, {
      rollType: "GENERAL_ROLL",
      diceExpression: roll.diceExpression,
      results: roll.results,
      total: roll.total,
      metadata: {
        source: "enemyInstance",
        enemyInstanceId,
        enemyName,
        diceRoller: "enemyInstance",
        ...(note ? { note } : {}),
      },
    });
  }, [tryExecuteFreeRoll, freeNote, gameId, enemyInstanceId, enemyName]);

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title={`Dice roller — ${enemyName}`}
      titleId="enemy-instance-dice-roller-title"
      subtitle="Damage and free rolls (Discord)."
      maxWidthClass="max-w-md"
      panelClassName="min-h-[min(58vh,28rem)]"
      footer={
        <Button type="button" variant="modalFooterSecondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={
              tab === "free" ? "modalOptionSelected" : "modalOptionUnselected"
            }
            onClick={() => setTab("free")}
          >
            Free
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
        </div>

        {tab === "damage" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm text-white">Number of dice</span>
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
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectDropdown
                id="enemy-damage-dice-sides"
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
                id="enemy-damage-type"
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
            {damageResult ? (
              <p className="text-sm text-white/90">
                {damageResult.join(" + ")} ={" "}
                <span className="font-semibold tabular-nums">
                  {damageResult.reduce((a, b) => a + b, 0)}
                </span>
              </p>
            ) : null}
          </div>
        )}

        {tab === "free" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm text-white">Number of dice</span>
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
                    id="enemy-free-roll-dice-sides"
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

            <label className="text-sm text-white">
              Note (optional)
              <input
                type="text"
                value={freeNote}
                onChange={(e) => setFreeNote(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-md border border-white/30 bg-black/20 px-3 py-2 text-white"
                placeholder="e.g. Perception"
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
            {freeResult ? (
              <p className="text-sm text-white/90">
                {freeResult.join(" + ")} ={" "}
                <span className="font-semibold tabular-nums">
                  {freeResult.reduce((a, b) => a + b, 0)}
                </span>
              </p>
            ) : null}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
