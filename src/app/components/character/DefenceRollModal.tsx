"use client";

import Button from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { useCallback, useEffect, useState } from "react";
import { emitRollEvent } from "@/app/lib/roll-event-client";

export interface DefenceRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Number of d10 attack dice to roll (defence mod). */
  defenceDice: number;
  /** Title shown in the modal (e.g. "Melee Defence"). */
  title: string;
  /** When true, consuming a reaction is not possible and the roll button is disabled. */
  reactionDisabled?: boolean;
  /** Called when the user actually presses ROLL (consumes exactly one reaction). */
  onRollReaction?: () => void | Promise<void>;
  gameId?: string | null;
  characterId?: string;
  /** When set, roll is attributed to an enemy instance instead of a character (Discord metadata). */
  enemyInstanceRoll?: { instanceId: string; name: string };
}

function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

export function DefenceRollModal({
  isOpen,
  onClose,
  defenceDice,
  title,
  reactionDisabled = false,
  onRollReaction,
  gameId,
  characterId,
  enemyInstanceRoll,
}: DefenceRollModalProps) {
  const [extraDice, setExtraDice] = useState(0);
  const [rollResult, setRollResult] = useState<number[] | null>(null);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setExtraDice(0);
      setRollResult(null);
      setRolling(false);
    }
  }, [isOpen]);

  const totalDice = Math.max(0, defenceDice + extraDice);

  const handleRoll = useCallback(async () => {
    if (reactionDisabled || rolling) return;
    setRolling(true);
    try {
      if (onRollReaction) {
        await onRollReaction();
      }

      const results = Array.from({ length: totalDice }, () => rollD10());
      results.sort((a, b) => b - a);
      setRollResult(results);
      void emitRollEvent(gameId, {
        characterId: enemyInstanceRoll ? undefined : characterId,
        rollType: "DEFENCE",
        diceExpression: `${totalDice}d10`,
        results,
        metadata: {
          title,
          defenceDice,
          extraDice,
          ...(enemyInstanceRoll
            ? {
                source: "enemyInstance",
                enemyInstanceId: enemyInstanceRoll.instanceId,
                enemyName: enemyInstanceRoll.name,
              }
            : {}),
        },
      });
    } finally {
      setRolling(false);
    }
  }, [
    reactionDisabled,
    rolling,
    onRollReaction,
    totalDice,
    gameId,
    characterId,
    enemyInstanceRoll,
    title,
    defenceDice,
    extraDice,
  ]);

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title={`${title} roll`}
      titleId="defence-roll-modal-title"
      maxWidthClass="max-w-sm"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="modalFooterPrimary"
            fullWidth={false}
            className="flex-1"
            onClick={() => void handleRoll()}
            disabled={reactionDisabled || totalDice === 0}
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
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-white">Extra dice</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="modalIconStepper"
              fullWidth={false}
              onClick={() => setExtraDice((d) => d - 1)}
              aria-label="Decrease extra dice"
            >
              −
            </Button>
            <span className="min-w-[2.5rem] text-center text-sm font-bold text-white">
              {extraDice >= 0 ? `+${extraDice}` : extraDice}
            </span>
            <Button
              type="button"
              variant="modalIconStepper"
              fullWidth={false}
              onClick={() => setExtraDice((d) => d + 1)}
              aria-label="Increase extra dice"
            >
              +
            </Button>
          </div>
        </div>

        <p className="text-sm font-medium text-white">
          Base: {defenceDice} d10
        </p>
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
      </div>
    </ModalShell>
  );
}
