"use client";

import { Button } from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { PrivateRollCheckbox } from "@/app/components/shared/PrivateRollCheckbox";
import { botInitiativeModifier } from "@/app/lib/botInitiative";
import type { RollPrivacyOptions } from "@/app/lib/roll-privacy";
import type { BotHolding } from "@/app/lib/types/bot";
import { usePrivateRollState } from "@/hooks/use-private-roll-state";
import { emitGameRollEvent, submitGameInitiative } from "@/lib/api/game";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useState } from "react";

function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

export function BotInitiativeRollModal({
  holding,
  characterId,
  gameId,
  rollPrivacy,
  onClose,
}: {
  holding: BotHolding;
  characterId: string;
  gameId: string;
  rollPrivacy: RollPrivacyOptions;
  onClose: () => void;
}) {
  const [face, setFace] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { isPrivateRoll, setIsPrivateRoll, emitIsPrivate } =
    usePrivateRollState(true, rollPrivacy);

  const modifier = botInitiativeModifier(
    holding.attributes.processingPower.effective,
    holding.attributes.finesseCapacity.effective
  );
  const signed = `${modifier >= 0 ? "+" : ""}${modifier}`;
  const total = face == null ? null : face + modifier;

  const handleRoll = async () => {
    if (!holding.mayRoll || submitting) return;
    const rolled = rollD10();
    setSubmitting(true);
    setError(null);
    try {
      await submitGameInitiative(gameId, {
        combatantType: "BOT",
        combatantId: holding.id,
        rolledValue: rolled,
      });
      await emitGameRollEvent(gameId, {
        characterId,
        isPrivate: emitIsPrivate,
        rollType: "INITIATIVE",
        diceExpression: "1d10",
        results: [rolled],
        botCharacterId: holding.id,
      });
      setFace(rolled);
    } catch (rollError) {
      setFace(null);
      setError(
        getUserSafeErrorMessage(rollError, "Could not register initiative.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title="Initiative roll"
      titleId="bot-initiative-roll-title"
      maxWidthClass="max-w-sm"
      zIndexClass="z-[70]"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="modalFooterPrimary"
            fullWidth={false}
            className="flex-1"
            disabled={!holding.mayRoll || submitting || face != null}
            onClick={() => {
              void handleRoll();
            }}
          >
            {submitting ? "Registering…" : "Roll initiative"}
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
        <p className="text-sm text-white/90">
          Roll{" "}
          <span className="font-semibold tabular-nums text-white">
            1d10 {signed}
          </span>{" "}
          for {holding.displayName}. One die. The modifier is stored with the
          entry.
        </p>

        {rollPrivacy.allowPrivateRoll ? (
          <PrivateRollCheckbox
            checked={isPrivateRoll}
            onChange={setIsPrivateRoll}
          />
        ) : null}

        {holding.mayRoll ? null : (
          <p className="text-sm text-neblirDanger-300">
            This bot cannot roll initiative.
          </p>
        )}

        {error ? (
          <p className="text-sm text-neblirDanger-300">{error}</p>
        ) : null}

        {face != null && total != null ? (
          <div className="rounded border border-white/20 bg-black/20 px-3 py-2 text-sm text-white">
            <p className="tabular-nums">
              d10: <span className="font-semibold">{face}</span>
              {" · "}
              Modifier: <span className="font-semibold">{signed}</span>
              {" · "}
              Total: <span className="font-semibold">{total}</span>
            </p>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
