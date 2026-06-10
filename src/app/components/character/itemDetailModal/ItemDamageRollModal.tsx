"use client";

import { ModalShell } from "@/app/components/shared/ModalShell";
import { Button } from "@/app/components/shared/Button";
import { PrivateRollCheckbox } from "@/app/components/shared/PrivateRollCheckbox";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import type { RollPrivacyOptions } from "@/app/lib/roll-privacy";
import { usePrivateRollState } from "@/hooks/use-private-roll-state";
import { useEffect, useState } from "react";
import type { WeaponDamageSlice } from "./weaponDerived";
import { rollDice } from "./utils";

type ItemDamageRollModalProps = {
  isOpen: boolean;
  onClose: () => void;
  damage: WeaponDamageSlice;
  gameId?: string | null;
  characterId?: string;
  rollPrivacy?: RollPrivacyOptions;
};

export function ItemDamageRollModal({
  isOpen,
  onClose,
  damage,
  gameId,
  characterId,
  rollPrivacy = { allowPrivateRoll: false, defaultPrivateRoll: false },
}: ItemDamageRollModalProps) {
  const { isPrivateRoll, setIsPrivateRoll, emitIsPrivate } =
    usePrivateRollState(isOpen, rollPrivacy);
  const [extraDice, setExtraDice] = useState(0);
  const [rollResult, setRollResult] = useState<number[] | null>(null);

  const baseDamageDice = damage.numberOfDice;
  const baseDamageType = damage.diceType;
  const totalDamageDice = Math.max(0, baseDamageDice + extraDice);

  useEffect(() => {
    if (isOpen) return;
    queueMicrotask(() => {
      setExtraDice(0);
      setRollResult(null);
    });
  }, [isOpen]);

  const handleRoll = () => {
    if (totalDamageDice <= 0 || baseDamageType <= 0) return;
    const results = Array.from({ length: totalDamageDice }, () =>
      rollDice(baseDamageType)
    );
    setRollResult(results);
    void emitRollEvent(gameId, {
      characterId,
      isPrivate: emitIsPrivate,
      rollType: "ITEM_DAMAGE",
      diceExpression: `${totalDamageDice}d${baseDamageType}`,
      results,
      total: results.reduce((sum, value) => sum + value, 0),
      metadata: { damageType: damage.damageType },
    });
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title="Damage roll"
      titleId="item-damage-roll-title"
      zIndexClass="z-[70]"
      maxWidthClass="max-w-xs"
      footer={
        <Button
          type="button"
          variant="modalFooterGhostFull"
          fullWidth
          onClick={onClose}
        >
          Close
        </Button>
      }
    >
      <div className="space-y-3 text-sm">
        {rollPrivacy.allowPrivateRoll && gameId ? (
          <PrivateRollCheckbox
            checked={isPrivateRoll}
            onChange={setIsPrivateRoll}
          />
        ) : null}

        <p className="text-white">
          Base: {baseDamageDice}d{baseDamageType}
        </p>
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/80">Extra dice</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="modalIconStepperFlatSm"
              fullWidth={false}
              onClick={() => setExtraDice((v) => v - 1)}
            >
              −
            </Button>
            <span className="min-w-[2rem] text-center text-sm font-semibold text-white">
              {extraDice >= 0 ? `+${extraDice}` : extraDice}
            </span>
            <Button
              type="button"
              variant="modalIconStepperFlatSm"
              fullWidth={false}
              onClick={() => setExtraDice((v) => v + 1)}
            >
              +
            </Button>
          </div>
        </div>
        <p className="text-white">
          Total: {totalDamageDice}d{baseDamageType}
        </p>
        <Button
          type="button"
          variant="semanticDangerOutline"
          onClick={handleRoll}
          disabled={totalDamageDice <= 0 || baseDamageType <= 0}
          className="w-full"
        >
          Roll damage
        </Button>
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
      </div>
    </ModalShell>
  );
}
