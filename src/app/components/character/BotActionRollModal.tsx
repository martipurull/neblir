"use client";

import { Button } from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { PrivateRollCheckbox } from "@/app/components/shared/PrivateRollCheckbox";
import {
  botAttributeDiceCount,
  botRollBlockedMessage,
  isBotAttributeSuccess,
} from "@/app/lib/botAttributeRoll";
import { sortDiceResultsHighToLow } from "@/app/lib/diceResults";
import { rollDie } from "@/app/lib/general-dice";
import type { RollPrivacyOptions } from "@/app/lib/roll-privacy";
import { BOT_UPGRADE_LABELS } from "@/app/lib/botTracks";
import type { BotActionRoll } from "@/app/lib/types/botAction";
import { usePrivateRollState } from "@/hooks/use-private-roll-state";
import { emitGameRollEvent } from "@/lib/api/game";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useState } from "react";

export type BotActionRollRequest =
  | {
      kind: "bot";
      list: "actions" | "additionalActions";
      action: BotActionRoll;
    }
  | {
      kind: "item";
      itemCharacterId: string;
      itemName: string;
      action: BotActionRoll;
    };

export function BotActionRollModal({
  request,
  characterId,
  botCharacterId,
  gameId,
  rollPrivacy,
  onClose,
}: {
  request: BotActionRollRequest;
  characterId: string;
  botCharacterId: string;
  gameId: string;
  rollPrivacy: RollPrivacyOptions;
  onClose: () => void;
}) {
  const action = request.action;
  const [extraDice, setExtraDice] = useState(0);
  const [rollResult, setRollResult] = useState<number[] | null>(null);
  const [damageResult, setDamageResult] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { isPrivateRoll, setIsPrivateRoll, emitIsPrivate } =
    usePrivateRollState(true, rollPrivacy);

  const toHitDice = botAttributeDiceCount(action.toHitPool, extraDice);
  const damageDice =
    action.damage == null
      ? 0
      : botAttributeDiceCount(action.damage.pool, extraDice);
  const successes = rollResult?.filter(isBotAttributeSuccess).length ?? null;
  const damageTotal =
    damageResult == null
      ? null
      : damageResult.reduce((sum, face) => sum + face, 0);
  const blocked = botRollBlockedMessage(action);
  const canSubmit =
    action.mayRoll &&
    toHitDice > 0 &&
    (action.damage == null || damageDice > 0) &&
    !submitting;

  const clearResult = () => {
    setRollResult(null);
    setDamageResult(null);
    setError(null);
  };

  const handleRoll = async () => {
    if (!canSubmit) return;
    const results = sortDiceResultsHighToLow(
      Array.from({ length: toHitDice }, () => rollDie(10))
    );
    const damage = action.damage;
    const damageFaces =
      damage == null
        ? undefined
        : Array.from({ length: damageDice }, () => rollDie(damage.diceType));
    setSubmitting(true);
    setError(null);
    try {
      await emitGameRollEvent(gameId, {
        characterId,
        isPrivate: emitIsPrivate,
        rollType: "GENERAL_ROLL",
        diceExpression: `${toHitDice}d10`,
        results,
        botCharacterId,
        extraDice,
        ...(request.kind === "item"
          ? {
              botItemAction: {
                itemCharacterId: request.itemCharacterId,
                index: action.index,
              },
            }
          : {
              botAction: { list: request.list, index: action.index },
            }),
        ...(damageFaces != null ? { damageResults: damageFaces } : {}),
      });
      setRollResult(results);
      setDamageResult(damageFaces ?? null);
    } catch (rollError) {
      setRollResult(null);
      setDamageResult(null);
      setError(getUserSafeErrorMessage(rollError, "Failed to roll"));
    } finally {
      setSubmitting(false);
    }
  };

  const attributeLabel =
    action.attribute == null ? null : BOT_UPGRADE_LABELS[action.attribute];

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title={`Roll ${action.name}`}
      titleId="bot-action-roll-title"
      maxWidthClass="max-w-sm"
      zIndexClass="z-[70]"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="modalFooterPrimary"
            fullWidth={false}
            className="flex-1"
            disabled={!canSubmit}
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
        {request.kind === "item" ? (
          <p className="text-sm text-white/70">{request.itemName}</p>
        ) : null}
        {action.description ? (
          <p className="text-sm text-white/80">{action.description}</p>
        ) : null}
        <p className="text-sm text-white/90">
          To hit: {action.toHitPool} dice
          {attributeLabel != null ? ` (${attributeLabel})` : ""}
        </p>
        {action.damage != null ? (
          <p className="text-sm text-white/90">
            Damage: {action.damage.pool}d{action.damage.diceType}{" "}
            {action.damage.damageType}
            {action.damage.attribute != null
              ? ` (${BOT_UPGRADE_LABELS[action.damage.attribute]})`
              : ""}
          </p>
        ) : null}
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <span className="shrink-0 text-sm font-medium text-white">
            Extra dice
          </span>
          <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="modalIconStepper"
              fullWidth={false}
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
          To hit: {toHitDice} d10{toHitDice === 1 ? "" : "s"}
          {action.damage != null
            ? ` · Damage: ${damageDice} d${action.damage.diceType}`
            : ""}
        </p>
        {blocked != null ? (
          <p className="text-sm text-neblirWarning-300">{blocked}</p>
        ) : null}
        {error ? (
          <p className="text-sm text-neblirDanger-300">{error}</p>
        ) : null}
        {rollResult !== null && successes !== null ? (
          <div className="rounded border border-white/30 bg-black/20 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/80">
              To hit · {successes} {successes === 1 ? "success" : "successes"}
            </p>
            <p className="flex flex-wrap gap-x-2 gap-y-0.5 text-lg tabular-nums text-white">
              {rollResult.map((value, index) => (
                <span
                  key={`${value}-${index}`}
                  className={
                    isBotAttributeSuccess(value)
                      ? "text-neblirSafe-600"
                      : undefined
                  }
                >
                  {value}
                  {index < rollResult.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
            {damageResult != null && damageTotal != null ? (
              <p className="mt-2 text-sm text-white">
                Damage {damageTotal}: {damageResult.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
