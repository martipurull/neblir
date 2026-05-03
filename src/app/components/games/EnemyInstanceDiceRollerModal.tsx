"use client";

import { emitRollEvent } from "@/app/lib/roll-event-client";
import { weaponDamageTypeSchema } from "@/app/lib/types/item";
import Button from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import {
  SelectDropdown,
  type SelectDropdownOption,
} from "@/app/components/shared/SelectDropdown";
import { useCallback, useEffect, useState } from "react";

type TabId = "damage" | "free";
type WeaponDamageType = (typeof weaponDamageTypeSchema.options)[number];

const DAMAGE_DICE_OPTIONS: SelectDropdownOption[] = [
  { value: "d6", label: "d6" },
  { value: "d8", label: "d8" },
  { value: "d10", label: "d10" },
];
const DAMAGE_TYPE_OPTIONS: SelectDropdownOption[] =
  weaponDamageTypeSchema.options.map((value) => ({
    value,
    label: value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " "),
  }));
const COMMON_DICE_OPTIONS: SelectDropdownOption[] = [
  { value: "d4", label: "d4" },
  { value: "d6", label: "d6" },
  { value: "d8", label: "d8" },
  { value: "d10", label: "d10" },
  { value: "d20", label: "d20" },
  { value: "d100", label: "d100" },
  { value: "custom", label: "Any sides (custom)" },
];

function rollDie(sides: number) {
  return Math.floor(Math.random() * sides) + 1;
}

function getSidesFromDieOption(value: string): number | null {
  if (!value.startsWith("d")) return null;
  const parsed = Number.parseInt(value.slice(1), 10);
  if (!Number.isInteger(parsed) || parsed < 2) return null;
  return parsed;
}

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
  const [tab, setTab] = useState<TabId>("damage");
  const [damageDiceCount, setDamageDiceCount] = useState(1);
  const [damageDiceType, setDamageDiceType] = useState(6);
  const [damageType, setDamageType] = useState<WeaponDamageType>("OTHER");
  const [damageResult, setDamageResult] = useState<number[] | null>(null);
  const [freeDiceCount, setFreeDiceCount] = useState(1);
  const [freeDiceType, setFreeDiceType] = useState(10);
  const [freeDiceTypeMode, setFreeDiceTypeMode] = useState<
    "quick" | "advanced"
  >("quick");
  const [freeAdvancedDiceOption, setFreeAdvancedDiceOption] = useState("d10");
  const [freeCustomSides, setFreeCustomSides] = useState(10);
  const [freeNote, setFreeNote] = useState("");
  const [freeResult, setFreeResult] = useState<number[] | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setTab("damage");
      setDamageDiceCount(1);
      setDamageDiceType(6);
      setDamageType("OTHER");
      setDamageResult(null);
      setFreeDiceCount(1);
      setFreeDiceType(10);
      setFreeDiceTypeMode("quick");
      setFreeAdvancedDiceOption("d10");
      setFreeCustomSides(10);
      setFreeNote("");
      setFreeResult(null);
    });
  }, [isOpen]);

  const setFreeDiceTypeAndClearResult = (nextSides: number) => {
    setFreeDiceType(nextSides);
    setFreeResult(null);
  };

  const handleFreeAdvancedDiceOptionChange = (value: string) => {
    setFreeAdvancedDiceOption(value);
    if (value === "custom") {
      const clamped = Math.max(2, freeCustomSides);
      setFreeCustomSides(clamped);
      setFreeDiceTypeAndClearResult(clamped);
      return;
    }
    const sides = getSidesFromDieOption(value);
    if (!sides) return;
    setFreeDiceTypeAndClearResult(sides);
  };

  const handleEnableFreeAdvancedDice = () => {
    setFreeDiceTypeMode("advanced");
    const asCommonOption = `d${freeDiceType}`;
    const isCommon = COMMON_DICE_OPTIONS.some(
      (o) => o.value === asCommonOption
    );
    if (isCommon) {
      setFreeAdvancedDiceOption(asCommonOption);
      return;
    }
    setFreeAdvancedDiceOption("custom");
    setFreeCustomSides(Math.max(2, freeDiceType));
  };

  const handleReturnToFreeQuickDice = () => {
    setFreeDiceTypeMode("quick");
    if (freeDiceType === 6 || freeDiceType === 10) return;
    setFreeDiceTypeAndClearResult(10);
  };

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
    if (freeDiceCount <= 0 || freeDiceType <= 1) return;
    const results = Array.from({ length: freeDiceCount }, () =>
      rollDie(freeDiceType)
    ).sort((a, b) => b - a);
    setFreeResult(results);
    const note = freeNote.trim();
    void emitRollEvent(gameId, {
      rollType: "GENERAL_ROLL",
      diceExpression: `${freeDiceCount}d${freeDiceType}`,
      results,
      total: results.reduce((sum, value) => sum + value, 0),
      metadata: {
        source: "enemyInstance",
        enemyInstanceId,
        enemyName,
        diceRoller: "enemyInstance",
        ...(note ? { note } : {}),
      },
    });
  }, [
    freeDiceCount,
    freeDiceType,
    freeNote,
    gameId,
    enemyInstanceId,
    enemyName,
  ]);

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title={`Dice roller — ${enemyName}`}
      titleId="enemy-instance-dice-roller-title"
      subtitle="Damage and free rolls (Discord)."
      maxWidthClass="max-w-md"
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
                  onClick={() => {
                    setFreeDiceCount((d) => Math.max(1, d - 1));
                    setFreeResult(null);
                  }}
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
                  onClick={() => {
                    setFreeDiceCount((d) => d + 1);
                    setFreeResult(null);
                  }}
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
                    options={COMMON_DICE_OPTIONS}
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
                          const next = Math.max(
                            2,
                            Math.trunc(Number(e.target.value) || 0)
                          );
                          setFreeCustomSides(next);
                          setFreeDiceTypeAndClearResult(next);
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
              disabled={freeDiceCount <= 0 || freeDiceType <= 1}
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
