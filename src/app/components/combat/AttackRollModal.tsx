"use client";

import {
  applyAttackRollSession,
  attackRollSessionShown,
  openAttackRollSession,
  type AttackRollWeaponOption,
} from "@/app/lib/attackRollSession";
import type { AttackModifierOption } from "@/app/lib/equipCombatUtils";
import { Button } from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { PrivateRollCheckbox } from "@/app/components/shared/PrivateRollCheckbox";
import { isD10Success, sortDiceResultsHighToLow } from "@/app/lib/diceResults";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import type { RollPrivacyOptions } from "@/app/lib/roll-privacy";
import { usePrivateRollState } from "@/hooks/use-private-roll-state";
import { useState } from "react";
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
  /** When set, roll is attributed to an enemy instance instead of a character (Discord metadata). */
  enemyInstanceRoll?: { instanceId: string; name: string };
  rollPrivacy?: RollPrivacyOptions;
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

function bestOptionIndex(options: readonly AttackModifierOption[]): number {
  if (options.length === 0) return 0;
  return options.reduce(
    (best, opt, i) => (opt.mod > (options[best]?.mod ?? -Infinity) ? i : best),
    0
  );
}

function damagePartsOf(
  weapon: AttackRollWeaponOption
): ReadonlyArray<{ numberOfDice: number; diceType: number }> {
  if (weapon.damageDice && weapon.damageDice.length > 0) {
    return weapon.damageDice;
  }
  return [{ numberOfDice: weapon.numberOfDice, diceType: weapon.diceType }];
}

function DamageRollTotal({
  faces,
  damageText,
}: {
  faces: readonly number[];
  damageText: string;
}) {
  const total = faces.reduce((sum, face) => sum + face, 0);
  const typeLabel = damageText ? formatDamageTypeLabel(damageText) : "";
  return (
    <div className="rounded border border-white/20 bg-black/20 p-2">
      <p className="text-xs font-medium uppercase tracking-wider text-white/70">
        Damage
      </p>
      <p className="text-base tabular-nums text-white">
        {faces.join(" + ")} ={" "}
        <span className="font-bold">
          {total} HP
          {typeLabel ? ` (${typeLabel})` : ""}
        </span>
      </p>
    </div>
  );
}

function attackRollModalSessionKey(props: AttackRollModalProps): string {
  const who =
    props.enemyInstanceRoll?.instanceId ?? props.characterId ?? "roll";
  return `${props.attackType}:${who}`;
}

export function AttackRollModal(props: AttackRollModalProps) {
  if (!props.isOpen) return null;
  return (
    <OpenAttackRollModal key={attackRollModalSessionKey(props)} {...props} />
  );
}

function OpenAttackRollModal({
  onClose,
  attackType,
  options,
  modifierHint,
  damageHint,
  onWeaponUsed,
  gameId,
  characterId,
  enemyInstanceRoll,
  rollPrivacy = { allowPrivateRoll: false, defaultPrivateRoll: false },
}: AttackRollModalProps) {
  const { isPrivateRoll, setIsPrivateRoll, emitIsPrivate } =
    usePrivateRollState(true, rollPrivacy);
  const [selectedIndex, setSelectedIndex] = useState(() =>
    bestOptionIndex(options)
  );
  const [session, setSession] = useState(() =>
    openAttackRollSession({
      combatant: enemyInstanceRoll ? "enemyInstance" : "character",
      attackType,
      selectedWeapon: options[bestOptionIndex(options)],
    })
  );
  const shown = attackRollSessionShown(session);
  const boundedIndex =
    options.length === 0 ? 0 : Math.min(selectedIndex, options.length - 1);
  const selected = options[boundedIndex];
  const selectedMod = selected?.mod ?? 0;
  const totalDice = Math.max(0, selectedMod + shown.extraToHitDice);
  const dealDamage = shown.dealDamage;
  const damageWeapon = dealDamage?.weapon ?? null;
  const damageExtraDice = dealDamage?.extraDamageDice ?? 0;
  const damageDice = damageWeapon ? damagePartsOf(damageWeapon) : [];
  const baseDamageType = damageWeapon?.diceType ?? 4;
  const baseDamageDiceTotal = damageDice.reduce(
    (total, part) => total + Math.max(0, part.numberOfDice),
    0
  );
  const totalDamageDice = Math.max(0, baseDamageDiceTotal + damageExtraDice);

  const selectWeapon = (index: number) => {
    setSelectedIndex(index);
    const weapon = options[index];
    if (!weapon) return;
    setSession((current) =>
      applyAttackRollSession(current, {
        type: "changeSelectedWeapon",
        weapon,
      })
    );
  };

  const handleRoll = () => {
    if (!selected) return;
    if (selected.itemCharacterId && onWeaponUsed) {
      void onWeaponUsed(selected.itemCharacterId);
    }
    const extraToHitDice = shown.extraToHitDice;
    const count = Math.max(0, selectedMod + extraToHitDice);
    const results = sortDiceResultsHighToLow(
      Array.from({ length: count }, () => rollD10())
    );
    setSession((current) =>
      applyAttackRollSession(current, {
        type: "toHitRoll",
        dice: results,
        weapon: selected,
      })
    );
    void emitRollEvent(gameId, {
      characterId: enemyInstanceRoll ? undefined : characterId,
      isPrivate: emitIsPrivate,
      rollType: "ATTACK",
      diceExpression: `${count}d10`,
      results,
      metadata: {
        attackType,
        weaponName: selected.weaponName,
        modifier: selectedMod,
        extraDice: extraToHitDice,
        ...(enemyInstanceRoll
          ? {
              source: "enemyInstance",
              enemyInstanceId: enemyInstanceRoll.instanceId,
              enemyName: enemyInstanceRoll.name,
            }
          : {}),
      },
    });
  };

  const handleDamageRoll = () => {
    if (!dealDamage) return;
    const weapon = dealDamage.weapon;
    const extraDamageDiceForRoll = dealDamage.extraDamageDice;
    const parts = damagePartsOf(weapon);
    const results: number[] = [];

    for (const part of parts) {
      const count = Math.max(0, part.numberOfDice);
      for (let i = 0; i < count; i++) {
        results.push(rollDice(part.diceType));
      }
    }

    for (let i = 0; i < Math.max(0, extraDamageDiceForRoll); i++) {
      results.push(rollDice(weapon.diceType));
    }

    const ordered = sortDiceResultsHighToLow(results);
    const rolledCount = Math.max(
      0,
      parts.reduce((total, part) => total + Math.max(0, part.numberOfDice), 0) +
        extraDamageDiceForRoll
    );
    setSession((current) =>
      applyAttackRollSession(current, { type: "damageRoll", dice: ordered })
    );
    void emitRollEvent(gameId, {
      characterId: enemyInstanceRoll ? undefined : characterId,
      isPrivate: emitIsPrivate,
      rollType: "ATTACK_DAMAGE",
      diceExpression: `${rolledCount}d${weapon.diceType}`,
      results: ordered,
      total: ordered.reduce((sum, face) => sum + face, 0),
      metadata: {
        attackType,
        weaponName: weapon.weaponName,
        extraDamageDice: extraDamageDiceForRoll,
        ...(enemyInstanceRoll
          ? {
              source: "enemyInstance",
              enemyInstanceId: enemyInstanceRoll.instanceId,
              enemyName: enemyInstanceRoll.name,
            }
          : {}),
      },
    });
  };

  const title = ATTACK_LABELS[attackType];

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title={`${title} roll`}
      titleId="attack-roll-modal-title"
      maxWidthClass="max-w-sm"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="modalFooterPrimary"
            fullWidth={false}
            className="flex-1"
            onClick={() => void handleRoll()}
            disabled={totalDice === 0}
          >
            ROLL
          </Button>
          <Button
            type="button"
            variant="modalFooterSecondary"
            fullWidth={false}
            className="flex-1"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {rollPrivacy.allowPrivateRoll && gameId ? (
          <PrivateRollCheckbox
            checked={isPrivateRoll}
            onChange={setIsPrivateRoll}
          />
        ) : null}

        {modifierHint && (
          <p className="text-xs text-white/75">{modifierHint}</p>
        )}
        {attackType !== "grid" && options.length > 1 && (
          <div>
            <p className="mb-2 text-sm font-medium text-white">Select weapon</p>
            <div className="flex flex-col gap-2">
              {options.map((opt, i) => (
                <Button
                  key={i}
                  type="button"
                  variant={
                    boundedIndex === i
                      ? "modalOptionSelected"
                      : "modalOptionUnselected"
                  }
                  fullWidth={false}
                  className="w-full"
                  onClick={() => selectWeapon(i)}
                >
                  {optionLabel(opt)}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-white">Extra dice</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="modalIconStepper"
              fullWidth={false}
              onClick={() =>
                setSession((current) =>
                  applyAttackRollSession(current, {
                    type: "changeExtraToHitDice",
                    extraToHitDice: current.extraToHitDice - 1,
                  })
                )
              }
              aria-label="Decrease extra dice"
            >
              −
            </Button>
            <span className="min-w-[2.5rem] text-center text-sm font-bold text-white">
              {shown.extraToHitDice >= 0
                ? `+${shown.extraToHitDice}`
                : shown.extraToHitDice}
            </span>
            <Button
              type="button"
              variant="modalIconStepper"
              fullWidth={false}
              onClick={() =>
                setSession((current) =>
                  applyAttackRollSession(current, {
                    type: "changeExtraToHitDice",
                    extraToHitDice: current.extraToHitDice + 1,
                  })
                )
              }
              aria-label="Increase extra dice"
            >
              +
            </Button>
          </div>
        </div>

        <p className="text-sm font-medium text-white">
          Total: {totalDice} d10{totalDice !== 1 ? "s" : ""}
        </p>

        {shown.toHitDice !== null && (
          <div className="rounded border border-white/30 bg-black/20 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/80">
              Result
            </p>
            <p className="flex flex-wrap gap-x-2 gap-y-0.5 text-lg tabular-nums text-white">
              {shown.toHitDice.map((value, i) => {
                const isSuccess = isD10Success(value);
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
                    {i < (shown.toHitDice?.length ?? 0) - 1 ? ", " : ""}
                  </span>
                );
              })}
            </p>
          </div>
        )}

        {dealDamage && (
          <div className="space-y-3 rounded border border-white/30 bg-black/20 p-3">
            <p className="text-sm font-medium text-white">Deal Damage</p>
            {damageHint && (
              <p className="whitespace-pre-line text-xs text-white/75">
                {damageHint}
              </p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/80">Extra dice (GM)</span>
              <Button
                type="button"
                variant="modalIconStepperSmall"
                fullWidth={false}
                onClick={() =>
                  setSession((current) =>
                    applyAttackRollSession(current, {
                      type: "changeExtraDamageDice",
                      extraDamageDice: current.extraDamageDice - 1,
                    })
                  )
                }
                aria-label="Decrease extra damage dice"
              >
                −
              </Button>
              <span className="min-w-[2rem] text-center text-sm font-bold text-white">
                {damageExtraDice >= 0 ? `+${damageExtraDice}` : damageExtraDice}
              </span>
              <Button
                type="button"
                variant="modalIconStepperSmall"
                fullWidth={false}
                onClick={() =>
                  setSession((current) =>
                    applyAttackRollSession(current, {
                      type: "changeExtraDamageDice",
                      extraDamageDice: current.extraDamageDice + 1,
                    })
                  )
                }
                aria-label="Increase extra damage dice"
              >
                +
              </Button>
            </div>
            <p className="text-md text-white">
              {damageDice
                .filter((d) => d.numberOfDice > 0)
                .map((d) => `${d.numberOfDice}d${d.diceType}`)
                .join(" + ")}
              {damageExtraDice !== 0
                ? ` + ${damageExtraDice} extra d${baseDamageType}`
                : ""}{" "}
              = {totalDamageDice} total dice
            </p>
            <Button
              type="button"
              variant="modalBlockPrimary"
              onClick={handleDamageRoll}
              disabled={totalDamageDice === 0}
            >
              ROLL DAMAGE
            </Button>
            {dealDamage.damageResult !== null && (
              <DamageRollTotal
                faces={dealDamage.damageResult}
                damageText={dealDamage.weapon.damageText}
              />
            )}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
