"use client";

import { rollDice } from "@/app/components/character/itemDetailModal/utils";
import { getDamageRollWeaponOptions } from "@/app/lib/damageRollWeaponOptions";
import { sortDiceResultsHighToLow } from "@/app/lib/diceResults";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import type { RollPrivacyOptions } from "@/app/lib/roll-privacy";
import type { CharacterDetail } from "@/app/lib/types/character";
import { Button } from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { PrivateRollCheckbox } from "@/app/components/shared/PrivateRollCheckbox";
import { usePrivateRollState } from "@/hooks/use-private-roll-state";
import { useMemo, useState } from "react";

type InventoryDamageRollModalProps = {
  character: CharacterDetail;
  gameId?: string | null;
  rollPrivacy?: RollPrivacyOptions;
  onClose: () => void;
};

type DamageRollSnapshot = {
  optionLabel: string;
  diceExpression: string;
  results: number[];
  total: number;
};

function diceExpressionOf(dice: number[]): string {
  const counts = new Map<number, number>();
  for (const diceType of dice) {
    counts.set(diceType, (counts.get(diceType) ?? 0) + 1);
  }
  return [...counts]
    .map(([diceType, count]) => `${count}d${diceType}`)
    .join(" + ");
}

export function InventoryDamageRollModal({
  character,
  gameId,
  rollPrivacy = { allowPrivateRoll: false, defaultPrivateRoll: false },
  onClose,
}: InventoryDamageRollModalProps) {
  const { isPrivateRoll, setIsPrivateRoll, emitIsPrivate } =
    usePrivateRollState(true, rollPrivacy);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [extraDice, setExtraDice] = useState(0);
  const [lastResult, setLastResult] = useState<DamageRollSnapshot | null>(null);

  const options = useMemo(
    () => getDamageRollWeaponOptions(character),
    [character]
  );
  const selected =
    selectedIndex == null ? null : (options[selectedIndex] ?? null);
  const damageDice = selected?.damageDice ?? [];
  const baseDamageType = selected?.extraDiceType ?? 4;
  const baseDamageDiceTotal = damageDice.reduce(
    (total, die) => total + Math.max(0, die.numberOfDice),
    0
  );
  const totalDamageDice = Math.max(0, baseDamageDiceTotal + extraDice);

  const handleDamageRoll = () => {
    if (!selected || totalDamageDice === 0) return;

    const planned: number[] = [];
    for (const die of damageDice) {
      for (let i = 0; i < Math.max(0, die.numberOfDice); i++) {
        planned.push(die.diceType);
      }
    }
    if (extraDice > 0) {
      for (let i = 0; i < extraDice; i++) planned.push(baseDamageType);
    } else if (extraDice < 0) {
      planned.splice(Math.max(0, planned.length + extraDice));
    }

    const results = planned.map((diceType) => rollDice(diceType));

    const ordered = sortDiceResultsHighToLow(results);
    if (ordered.length === 0) return;

    const diceExpression = diceExpressionOf(planned);
    const total = ordered.reduce((sum, value) => sum + value, 0);
    setLastResult({
      optionLabel: selected.label,
      diceExpression,
      results: ordered,
      total,
    });
    void emitRollEvent(gameId, {
      characterId: character.id,
      isPrivate: emitIsPrivate,
      rollType: "ATTACK_DAMAGE",
      diceExpression,
      results: ordered,
      total,
      metadata: {
        attackType: selected.attackMode,
        weaponName: selected.displayName,
        extraDamageDice: extraDice,
      },
    });
  };

  const dicePreview = damageDice
    .filter((die) => die.numberOfDice > 0)
    .map((die) => `${die.numberOfDice}d${die.diceType}`)
    .join(" + ");

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title="Damage roll"
      titleId="inventory-damage-roll-title"
      maxWidthClass="max-w-sm"
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
      <div className="space-y-4">
        {rollPrivacy.allowPrivateRoll && gameId ? (
          <PrivateRollCheckbox
            checked={isPrivateRoll}
            onChange={setIsPrivateRoll}
          />
        ) : null}

        <div>
          <p className="mb-2 text-sm font-medium text-white">Weapon</p>
          <div className="flex flex-col gap-2">
            {options.map((option, index) => (
              <Button
                key={`${option.attackMode}-${option.displayName}-${index}`}
                type="button"
                variant={
                  selectedIndex === index
                    ? "modalOptionSelected"
                    : "modalOptionUnselected"
                }
                fullWidth={false}
                className="w-full"
                aria-pressed={selectedIndex === index}
                onClick={() => setSelectedIndex(index)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-white/80">Extra dice (GM)</span>
          <Button
            type="button"
            variant="modalIconStepperSmall"
            fullWidth={false}
            onClick={() => setExtraDice((count) => count - 1)}
            aria-label="Decrease extra damage dice"
          >
            −
          </Button>
          <span className="min-w-[2rem] text-center text-sm font-bold text-white">
            {extraDice >= 0 ? `+${extraDice}` : extraDice}
          </span>
          <Button
            type="button"
            variant="modalIconStepperSmall"
            fullWidth={false}
            onClick={() => setExtraDice((count) => count + 1)}
            aria-label="Increase extra damage dice"
          >
            +
          </Button>
        </div>

        {selected ? (
          <p className="text-sm text-white">
            {dicePreview}
            {extraDice !== 0
              ? ` + ${extraDice} extra d${baseDamageType}`
              : ""}{" "}
            = {totalDamageDice} total dice
          </p>
        ) : null}

        <Button
          type="button"
          variant="modalBlockPrimary"
          onClick={handleDamageRoll}
          disabled={selected == null || totalDamageDice === 0}
        >
          Roll damage
        </Button>

        {lastResult ? (
          <div className="rounded border border-white/20 bg-black/20 p-2">
            <p className="text-xs font-medium uppercase tracking-wider text-white/70">
              Result
            </p>
            <p className="text-sm text-white">{lastResult.optionLabel}</p>
            <p className="text-sm text-white">{lastResult.diceExpression}</p>
            <p className="text-base tabular-nums text-white">
              {lastResult.results.join(" + ")} ={" "}
              <span className="font-bold">{lastResult.total} HP</span>
            </p>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
