"use client";

import { Button } from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { PrivateRollCheckbox } from "@/app/components/shared/PrivateRollCheckbox";
import {
  botAttributeDiceCount,
  botAttributePool,
  type BotAttributeRoll,
} from "@/app/lib/botAttributeRoll";
import { BOT_UPGRADE_LABELS, shownTrackFigure } from "@/app/lib/botTracks";
import { isD10Success, sortDiceResultsHighToLow } from "@/app/lib/diceResults";
import type { RollPrivacyOptions } from "@/app/lib/roll-privacy";
import type { BotHolding } from "@/app/lib/types/bot";
import { usePrivateRollState } from "@/hooks/use-private-roll-state";
import { emitGameRollEvent } from "@/lib/api/game";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useState } from "react";

function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

export function BotAttributeRollModal({
  holding,
  attribute,
  characterId,
  gameId,
  rollPrivacy,
  onClose,
}: {
  holding: BotHolding;
  attribute: BotAttributeRoll;
  characterId: string;
  gameId: string;
  rollPrivacy: RollPrivacyOptions;
  onClose: () => void;
}) {
  const [extraDice, setExtraDice] = useState(0);
  const [rollResult, setRollResult] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { isPrivateRoll, setIsPrivateRoll, emitIsPrivate } =
    usePrivateRollState(true, rollPrivacy);

  const figure = holding.attributes[attribute];
  const label = BOT_UPGRADE_LABELS[attribute];
  const pool = botAttributePool(figure.effective);
  const totalDice = botAttributeDiceCount(pool, extraDice);
  const successes =
    rollResult?.filter((face) => isD10Success(face) && face <= 10).length ??
    null;

  const clearResult = () => {
    setRollResult(null);
    setError(null);
  };

  const handleRoll = async () => {
    if (!holding.mayRoll || totalDice === 0 || submitting) return;
    const results = sortDiceResultsHighToLow(
      Array.from({ length: totalDice }, () => rollD10())
    );
    setSubmitting(true);
    setError(null);
    try {
      await emitGameRollEvent(gameId, {
        characterId,
        isPrivate: emitIsPrivate,
        rollType: "GENERAL_ROLL",
        diceExpression: `${totalDice}d10`,
        results,
        botCharacterId: holding.id,
        botAttribute: attribute,
        extraDice,
      });
      setRollResult(results);
    } catch (rollError) {
      setRollResult(null);
      setError(getUserSafeErrorMessage(rollError, "Failed to roll"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title={`Roll ${label}`}
      titleId="bot-attribute-roll-title"
      maxWidthClass="max-w-sm"
      zIndexClass="z-[70]"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="modalFooterPrimary"
            fullWidth={false}
            className="flex-1"
            disabled={!holding.mayRoll || totalDice === 0 || submitting}
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

        <p className="text-sm text-white/90">
          {label} (
          {shownTrackFigure(
            figure.base,
            figure.effective,
            figure.signedUpgrade
          )}
          ) = {pool} dice
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
          Total: {totalDice} d10{totalDice === 1 ? "" : "s"}
        </p>

        {error ? (
          <p className="text-sm text-neblirDanger-300">{error}</p>
        ) : null}

        {rollResult !== null && successes !== null ? (
          <div className="rounded border border-white/30 bg-black/20 p-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/80">
              Result · {successes} {successes === 1 ? "success" : "successes"}
            </p>
            <p className="flex flex-wrap gap-x-2 gap-y-0.5 text-lg tabular-nums text-white">
              {rollResult.map((value, index) => {
                const isSuccess = isD10Success(value);
                const spanClass = [
                  isSuccess ? "text-neblirSafe-600" : "",
                  value === 1 ? "text-neblirDanger-400" : "",
                  value === 10 ? "font-bold" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <span
                    key={`${value}-${index}`}
                    className={spanClass || undefined}
                  >
                    {value}
                    {index < rollResult.length - 1 ? ", " : ""}
                  </span>
                );
              })}
            </p>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
