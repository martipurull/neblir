// eslint-disable-next-line no-unused-expressions
"use client";

import type { AttackModifierOption } from "@/app/lib/equipCombatUtils";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import React, { useCallback, useEffect, useMemo, useState } from "react";

export type AttackType = "melee" | "range" | "throw" | "grid";

const ATTACK_LABELS: Record<AttackType, string> = {
  melee: "Melee Attack",
  range: "Range Attack",
  throw: "Throw Attack",
  grid: "GRID Attack",
};

export interface AttackRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  attackType: AttackType;
  options: AttackModifierOption[];
  /** Optional small helper text describing how modifier is computed. */
  modifierHint?: string;
  /** Optional note shown in damage section (e.g. Software Warrior bonus). */
  damageHint?: string;
  /** When the user rolls with a limited-use weapon, call with its ItemCharacter id to decrement uses */
  onWeaponUsed?: (itemCharacterId: string) => void | Promise<void>;
  gameId?: string | null;
  characterId?: string;
}

function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

function rollDice(diceType: number): number {
  return Math.floor(Math.random() * diceType) + 1;
}

function fmt(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

function optionLabel(o: AttackModifierOption): string {
  const mod = fmt(o.mod);
  const suffix = o.damageText ? ` (${o.damageText})` : "";
  return `${mod} ${o.weaponName}${suffix}`;
}

function formatDamageTypeLabel(damageText: string): string {
  const parts = damageText.split(", ").slice(1);
  if (parts.length === 0) return "";
  const types = parts
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
    .join(", ");
  return types ? `${types} damage` : "";
}

export function AttackRollModal({
  isOpen,
  onClose,
  attackType,
  options,
  modifierHint,
  damageHint,
  onWeaponUsed,
  gameId,
  characterId,
}: AttackRollModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [extraDice, setExtraDice] = useState(0);
  const [rollResult, setRollResult] = useState<number[] | null>(null);
  const [damageExtraDice, setDamageExtraDice] = useState(0);
  const [damageRollResult, setDamageRollResult] = useState<number[] | null>(
    null
  );

  const selected = options[selectedIndex];
  const selectedMod = selected?.mod ?? 0;
  const totalDice = Math.max(0, selectedMod + extraDice);

  useEffect(() => {
    if (isOpen) {
      const best =
        options.length > 0
          ? options.reduce(
              (b, opt, i) => (opt.mod > (options[b]?.mod ?? -Infinity) ? i : b),
              0
            )
          : 0;
      setSelectedIndex(best);
      setExtraDice(0);
      setRollResult(null);
      setDamageExtraDice(0);
      setDamageRollResult(null);
    }
  }, [isOpen, options]);

  const handleRoll = useCallback(async () => {
    if (selected?.itemCharacterId && onWeaponUsed) {
      await onWeaponUsed(selected.itemCharacterId);
    }
    const count = Math.max(0, selectedMod + extraDice);
    const results = Array.from({ length: count }, () => rollD10());
    results.sort((a, b) => b - a);
    setRollResult(results);
    void emitRollEvent(gameId, {
      characterId,
      rollType: "ATTACK",
      diceExpression: `${count}d10`,
      results,
      metadata: {
        attackType,
        weaponName: selected?.weaponName ?? null,
        modifier: selectedMod,
        extraDice,
      },
    });
  }, [
    selectedMod,
    extraDice,
    selected?.itemCharacterId,
    onWeaponUsed,
    gameId,
    characterId,
    attackType,
    selected?.weaponName,
  ]);

  const baseDamageDice = selected?.numberOfDice ?? 0;
  const baseDamageType = selected?.diceType ?? 4;
  const damageDice = useMemo(
    () =>
      selected?.damageDice ?? [
        { numberOfDice: baseDamageDice, diceType: baseDamageType },
      ],
    [selected?.damageDice, baseDamageDice, baseDamageType]
  );
  const baseDamageDiceTotal = damageDice.reduce(
    (a, d) => a + Math.max(0, d.numberOfDice),
    0
  );
  const totalDamageDice = Math.max(0, baseDamageDiceTotal + damageExtraDice);

  const handleDamageRoll = useCallback(() => {
    const results: number[] = [];

    for (const d of damageDice) {
      const count = Math.max(0, d.numberOfDice);
      for (let i = 0; i < count; i++) {
        results.push(rollDice(d.diceType));
      }
    }

    // GM extra dice are rolled using the base damage dice type.
    for (let i = 0; i < Math.max(0, damageExtraDice); i++) {
      results.push(rollDice(baseDamageType));
    }

    setDamageRollResult(results);
    void emitRollEvent(gameId, {
      characterId,
      rollType: "ATTACK_DAMAGE",
      diceExpression: `${totalDamageDice}d${baseDamageType}`,
      results,
      total: results.reduce((a, b) => a + b, 0),
      metadata: {
        attackType,
        weaponName: selected?.weaponName ?? null,
        extraDamageDice: damageExtraDice,
      },
    });
  }, [
    damageDice,
    baseDamageType,
    damageExtraDice,
    gameId,
    characterId,
    attackType,
    selected?.weaponName,
    totalDamageDice,
    // Keep totalDamageDice out of deps: it's derived from the above.
  ]);

  if (!isOpen) return null;

  const title = ATTACK_LABELS[attackType];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attack-roll-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border-2 border-white bg-modalBackground-200 p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            id="attack-roll-modal-title"
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
          {modifierHint && (
            <p className="text-xs text-white/75">{modifierHint}</p>
          )}
          {attackType !== "grid" && (
            <div>
              <p className="mb-2 text-sm font-medium text-white">
                Select weapon
              </p>
              <div className="flex flex-col gap-2">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedIndex(i)}
                    className={`rounded-md border-2 px-3 py-2 text-left text-sm font-semibold transition-colors ${
                      selectedIndex === i
                        ? "border-white bg-white text-black"
                        : "border-white bg-transparent text-white hover:bg-white/10"
                    }`}
                  >
                    {optionLabel(opt)}
                  </button>
                ))}
              </div>
            </div>
          )}

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

          {rollResult !== null &&
            rollResult.some((v) => v >= 8) &&
            (attackType !== "grid" || baseDamageDice > 0) && (
              <div className="space-y-3 rounded border border-white/30 bg-black/20 p-3">
                <p className="text-sm font-medium text-white">Deal Damage</p>
                {damageHint && (
                  <p className="text-xs text-white/75">{damageHint}</p>
                )}
                <p className="text-xs text-white/80">
                  {damageDice
                    .filter((d) => d.numberOfDice > 0)
                    .map((d) => `${d.numberOfDice}d${d.diceType}`)
                    .join(" + ")}
                  {damageExtraDice !== 0
                    ? ` + ${damageExtraDice} extra d${baseDamageType}`
                    : ""}{" "}
                  = {totalDamageDice} total dice
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/80">Extra dice (GM)</span>
                  <button
                    type="button"
                    onClick={() => setDamageExtraDice((d) => d - 1)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded border-2 border-white bg-transparent text-sm font-bold text-white transition-colors hover:bg-white/10"
                    aria-label="Decrease extra damage dice"
                  >
                    −
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-bold text-white">
                    {damageExtraDice >= 0
                      ? `+${damageExtraDice}`
                      : damageExtraDice}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDamageExtraDice((d) => d + 1)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded border-2 border-white bg-transparent text-sm font-bold text-white transition-colors hover:bg-white/10"
                    aria-label="Increase extra damage dice"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleDamageRoll}
                  disabled={totalDamageDice === 0}
                  className="w-full rounded border-2 border-white bg-white py-2 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white"
                >
                  ROLL DAMAGE
                </button>
                {damageRollResult !== null &&
                  (() => {
                    const total = damageRollResult.reduce((a, b) => a + b, 0);
                    const typeLabel = selected?.damageText
                      ? formatDamageTypeLabel(selected.damageText)
                      : "";
                    return (
                      <div className="rounded border border-white/20 bg-black/20 p-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                          Damage
                        </p>
                        <p className="text-base tabular-nums text-white">
                          {damageRollResult.join(" + ")} ={" "}
                          <span className="font-bold">
                            {total} HP
                            {typeLabel ? ` (${typeLabel})` : ""}
                          </span>
                        </p>
                      </div>
                    );
                  })()}
              </div>
            )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => void handleRoll()}
              disabled={totalDice === 0}
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
