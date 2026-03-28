"use client";

import { DangerButton } from "@/app/components/shared/SemanticActionButton";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import React, { useEffect, useState } from "react";
import type { WeaponDamageSlice } from "./weaponDerived";
import { rollDice } from "./utils";

type ItemDamageRollModalProps = {
  isOpen: boolean;
  onClose: () => void;
  damage: WeaponDamageSlice;
  gameId?: string | null;
  characterId?: string;
};

export function ItemDamageRollModal({
  isOpen,
  onClose,
  damage,
  gameId,
  characterId,
}: ItemDamageRollModalProps) {
  const [extraDice, setExtraDice] = useState(0);
  const [rollResult, setRollResult] = useState<number[] | null>(null);

  const baseDamageDice = damage.numberOfDice;
  const baseDamageType = damage.diceType;
  const totalDamageDice = Math.max(0, baseDamageDice + extraDice);

  useEffect(() => {
    if (!isOpen) {
      setExtraDice(0);
      setRollResult(null);
    }
  }, [isOpen]);

  const handleRoll = () => {
    if (totalDamageDice <= 0 || baseDamageType <= 0) return;
    const results = Array.from({ length: totalDamageDice }, () =>
      rollDice(baseDamageType)
    );
    setRollResult(results);
    void emitRollEvent(gameId, {
      characterId,
      rollType: "ITEM_DAMAGE",
      diceExpression: `${totalDamageDice}d${baseDamageType}`,
      results,
      total: results.reduce((sum, value) => sum + value, 0),
      metadata: { damageType: damage.damageType },
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-damage-roll-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-lg border-2 border-white bg-modalBackground-200 p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3
            id="item-damage-roll-title"
            className="text-base font-semibold text-white"
          >
            Damage roll
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white transition-colors hover:bg-white/10"
            aria-label="Close damage roll modal"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="mt-3 space-y-3 text-sm">
          <p className="text-white">
            Base: {baseDamageDice}d{baseDamageType}
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-white/80">Extra dice</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExtraDice((v) => v - 1)}
                className="flex h-8 w-8 items-center justify-center rounded border border-white bg-transparent text-white transition-colors hover:bg-white/10"
              >
                −
              </button>
              <span className="min-w-[2rem] text-center text-sm font-semibold text-white">
                {extraDice >= 0 ? `+${extraDice}` : extraDice}
              </span>
              <button
                type="button"
                onClick={() => setExtraDice((v) => v + 1)}
                className="flex h-8 w-8 items-center justify-center rounded border border-white bg-transparent text-white transition-colors hover:bg-white/10"
              >
                +
              </button>
            </div>
          </div>
          <p className="text-white">
            Total: {totalDamageDice}d{baseDamageType}
          </p>
          <DangerButton
            type="button"
            onClick={handleRoll}
            disabled={totalDamageDice <= 0 || baseDamageType <= 0}
            className="w-full"
          >
            Roll damage
          </DangerButton>
          {rollResult && (
            <div className="rounded border border-white/20 bg-black/20 p-2">
              <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                Result
              </p>
              <p className="text-sm text-white">
                {rollResult.join(" + ")} ={" "}
                <span className="font-bold">
                  {rollResult.reduce((sum, v) => sum + v, 0)}
                </span>
              </p>
            </div>
          )}
          <p className="text-xs text-white/60">
            {damage.damageType?.length
              ? `${damage.damageType.join(", ")}.`
              : "Damage."}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded border border-white/40 bg-transparent py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
