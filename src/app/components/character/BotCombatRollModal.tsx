"use client";

import { Button } from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { PrivateRollCheckbox } from "@/app/components/shared/PrivateRollCheckbox";
import {
  botAttributeDiceCount,
  isBotAttributeSuccess,
} from "@/app/lib/botAttributeRoll";
import {
  BOT_COMBAT_LABELS,
  botAttackChoices,
  botAttackPool,
  botDefencePool,
  isBotAttack,
  type BotAttackChoice,
  type BotCombatValue,
} from "@/app/lib/botCombat";
import { sortDiceResultsHighToLow } from "@/app/lib/diceResults";
import type { RollPrivacyOptions } from "@/app/lib/roll-privacy";
import type { BotHolding } from "@/app/lib/types/bot";
import type { ItemCharacter } from "@/app/lib/types/character";
import { usePrivateRollState } from "@/hooks/use-private-roll-state";
import { emitGameRollEvent } from "@/lib/api/game";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useState } from "react";
import { botCombatOfferItems } from "./BotCombatSection";

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function bestChoiceIndex(choices: readonly BotAttackChoice[]): number {
  if (choices.length === 0) return 0;
  return choices.reduce(
    (best, choice, index) =>
      choice.bonus > (choices[best]?.bonus ?? -Infinity) ? index : best,
    0
  );
}

export function BotCombatRollModal({
  holding,
  combat,
  inventory,
  characterId,
  gameId,
  rollPrivacy,
  onClose,
  onRolled,
}: {
  holding: BotHolding;
  combat: BotCombatValue;
  inventory: ItemCharacter[];
  characterId: string;
  gameId: string;
  rollPrivacy: RollPrivacyOptions;
  onClose: () => void;
  onRolled: () => void;
}) {
  const attack = isBotAttack(combat);
  const choices = attack
    ? botAttackChoices(combat, botCombatOfferItems(holding, inventory))
    : [];
  const [selectedIndex, setSelectedIndex] = useState(() =>
    bestChoiceIndex(choices)
  );
  const [committed, setCommitted] = useState<BotAttackChoice | null>(null);
  const [extraDice, setExtraDice] = useState(0);
  const [toHit, setToHit] = useState<number[] | null>(null);
  const [damageFaces, setDamageFaces] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { isPrivateRoll, setIsPrivateRoll, emitIsPrivate } =
    usePrivateRollState(true, rollPrivacy);

  const label = BOT_COMBAT_LABELS[combat];
  const boundedIndex =
    choices.length === 0 ? 0 : Math.min(selectedIndex, choices.length - 1);
  const selected = attack ? choices[boundedIndex] : null;
  const pool = attack
    ? botAttackPool(
        holding.combat,
        holding.attributes,
        combat,
        selected?.bonus ?? 0
      )
    : botDefencePool(holding.combat, holding.attributes, combat);
  const totalDice = botAttributeDiceCount(pool, extraDice);
  const reactionsShut = !attack && holding.reactionsRemaining <= 0;
  const canToHit =
    holding.mayRoll && !reactionsShut && totalDice > 0 && !submitting;
  const damage = committed?.damage ?? null;
  const damageCount = damage?.numberOfDice ?? 0;
  const successes = toHit?.filter(isBotAttributeSuccess).length ?? null;
  const damageTotal = damageFaces?.reduce((sum, face) => sum + face, 0) ?? null;

  const clearResult = () => {
    setToHit(null);
    setDamageFaces(null);
    setCommitted(null);
    setError(null);
  };

  const publish = async (
    rollType: "ATTACK" | "ATTACK_DAMAGE" | "DEFENCE" | "GRID_DEFENCE",
    results: number[],
    weapon: BotAttackChoice | null,
    dice: number
  ) => {
    await emitGameRollEvent(gameId, {
      characterId,
      isPrivate: emitIsPrivate,
      rollType,
      diceExpression: `${results.length}d${dice}`,
      results,
      botCharacterId: holding.id,
      botCombat: combat,
      extraDice: rollType === "ATTACK_DAMAGE" ? 0 : extraDice,
      ...(weapon?.itemCharacterId
        ? { botWeaponItemCharacterId: weapon.itemCharacterId }
        : {}),
    });
  };

  const handleRoll = async () => {
    if (!canToHit) return;
    const results = sortDiceResultsHighToLow(
      Array.from({ length: totalDice }, () => rollDie(10))
    );
    setSubmitting(true);
    setError(null);
    try {
      await publish(
        attack
          ? "ATTACK"
          : combat === "defenceGrid"
            ? "GRID_DEFENCE"
            : "DEFENCE",
        results,
        selected,
        10
      );
      setToHit(results);
      setCommitted(selected);
      onRolled();
    } catch (rollError) {
      setToHit(null);
      setError(getUserSafeErrorMessage(rollError, "Failed to roll"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDamage = async () => {
    if (!committed || damageCount <= 0 || submitting) return;
    const sides = committed.damage.diceType;
    const results = sortDiceResultsHighToLow(
      Array.from({ length: damageCount }, () => rollDie(sides))
    );
    setSubmitting(true);
    setError(null);
    try {
      await publish("ATTACK_DAMAGE", results, committed, sides);
      setDamageFaces(results);
      onRolled();
    } catch (rollError) {
      setDamageFaces(null);
      setError(getUserSafeErrorMessage(rollError, "Failed to roll damage"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title={`Roll ${label}`}
      titleId="bot-combat-roll-title"
      maxWidthClass="max-w-sm"
      zIndexClass="z-[70]"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="modalFooterPrimary"
            fullWidth={false}
            className="flex-1"
            disabled={!canToHit || toHit !== null}
            onClick={() => {
              void handleRoll();
            }}
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
        {rollPrivacy.allowPrivateRoll ? (
          <PrivateRollCheckbox
            checked={isPrivateRoll}
            onChange={setIsPrivateRoll}
          />
        ) : null}

        {attack ? (
          <div className="space-y-2">
            {choices.map((choice, index) => (
              <Button
                key={choice.itemCharacterId ?? choice.name}
                type="button"
                variant={
                  index === boundedIndex
                    ? "modalBrowseListRowSelected"
                    : "modalBrowseListRow"
                }
                disabled={toHit !== null}
                onClick={() => {
                  setSelectedIndex(index);
                  clearResult();
                }}
              >
                <span className="flex min-w-0 flex-1 flex-col items-start">
                  <span className="text-sm text-white">{choice.name}</span>
                  <span className="text-xs text-white/65">
                    {choice.damage.damageText || "No damage dice"}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        ) : null}

        <p className="text-sm text-white/90">
          {label} = {pool} dice
          {reactionsShut ? ". No Reactions remaining." : ""}
        </p>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <span className="shrink-0 text-sm font-medium text-white">
            Extra dice
          </span>
          <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="modalIconStepper"
              fullWidth={false}
              disabled={toHit !== null}
              onClick={() => {
                setExtraDice((dice) => dice - 1);
                clearResult();
              }}
              aria-label="Decrease extra dice"
            >
              −
            </Button>
            <span className="min-w-[2.5rem] shrink-0 whitespace-nowrap text-center text-sm font-bold text-white">
              {extraDice >= 0 ? `+${extraDice}` : extraDice}
            </span>
            <Button
              type="button"
              variant="modalIconStepper"
              fullWidth={false}
              disabled={toHit !== null}
              onClick={() => {
                setExtraDice((dice) => dice + 1);
                clearResult();
              }}
              aria-label="Increase extra dice"
            >
              +
            </Button>
          </div>
        </div>

        <p className="text-sm font-medium text-white">
          Total: {totalDice} d10{totalDice === 1 ? "" : "s"}
        </p>

        {error ? (
          <p className="text-sm text-neblirDanger-300">{error}</p>
        ) : null}

        {toHit !== null && successes !== null ? (
          <div className="rounded border border-white/30 bg-black/20 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/80">
              Result · {successes} {successes === 1 ? "success" : "successes"}
            </p>
            <p className="flex flex-wrap gap-x-2 gap-y-0.5 text-lg tabular-nums text-white">
              {toHit.map((value, index) => (
                <span key={`${value}-${index}`}>
                  {value}
                  {index < toHit.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          </div>
        ) : null}

        {toHit !== null && damageCount > 0 && committed ? (
          <div className="space-y-2">
            <Button
              type="button"
              variant="modalPaleOutline"
              disabled={submitting || damageFaces !== null}
              onClick={() => {
                void handleDamage();
              }}
            >
              Roll damage ({committed.damage.damageText})
            </Button>
            {damageFaces !== null && damageTotal !== null ? (
              <p className="text-sm text-white">
                {damageFaces.join(" + ")} = {damageTotal}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
