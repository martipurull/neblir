"use client";

import Button from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { isGmControlledGameCharacter } from "@/app/lib/gmInitiativeUtils";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import type { GameDetail } from "@/app/lib/types/game";
import { submitGameInitiative } from "@/lib/api/game";
import React, { useCallback, useMemo, useState } from "react";

function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

export interface GmNpcInitiativeRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameDetail;
  onSuccess: () => void | Promise<void>;
}

export function GmNpcInitiativeRollModal({
  isOpen,
  onClose,
  game,
  onSuccess,
}: GmNpcInitiativeRollModalProps) {
  const [rollingId, setRollingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const npcRows = useMemo(
    () =>
      (game.characters ?? []).filter((gc) =>
        isGmControlledGameCharacter(gc, game)
      ),
    [game]
  );

  const hasRolled = useCallback(
    (characterId: string) =>
      (game.initiativeOrder ?? []).some((e) => e.characterId === characterId),
    [game.initiativeOrder]
  );

  const handleRoll = useCallback(
    async (characterId: string, initiativeModifier: number) => {
      setError(null);
      setRollingId(characterId);
      try {
        const rolledValue = rollD10();
        await submitGameInitiative(game.id, {
          characterId,
          rolledValue,
          initiativeModifier,
        });
        await emitRollEvent(game.id, {
          characterId,
          rollType: "INITIATIVE",
          diceExpression: "1d10",
          results: [rolledValue],
          total: rolledValue + initiativeModifier,
          metadata: { initiativeModifier, source: "gmNpcModal" },
        });
        await onSuccess();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not register initiative."
        );
      } finally {
        setRollingId(null);
      }
    },
    [game.id, onSuccess]
  );

  if (!isOpen) return null;

  const modLabel = (m: number) => `${m >= 0 ? "+" : ""}${m}`;

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title="Roll initiative for GM-controlled characters / creatures"
      titleId="gm-npc-initiative-modal-title"
      maxWidthClass="max-w-md"
    >
      {npcRows.length === 0 ? (
        <p className="mt-4 text-sm text-white/80">
          No GM-controlled characters in this game yet. Add characters that only
          you control (or with no player owners in this game).
        </p>
      ) : (
        <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto">
          {npcRows.map((gc) => {
            const id = gc.character.id;
            const mod = gc.character.initiativeMod ?? 0;
            const name =
              `${gc.character.name}${gc.character.surname ? ` ${gc.character.surname}` : ""}`.trim();
            const done = hasRolled(id);
            const busy = rollingId === id;
            return (
              <li
                key={gc.id}
                className="flex items-center justify-between gap-2 rounded border border-white/15 bg-black/20 px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-white">
                  {name}
                </span>
                <Button
                  type="button"
                  variant="modalCompactWarning"
                  disabled={done || busy}
                  title={
                    done
                      ? "This character has already rolled initiative for this game."
                      : undefined
                  }
                  onClick={() => void handleRoll(id, mod)}
                >
                  {busy
                    ? "Rolling…"
                    : done
                      ? "Rolled"
                      : `Roll (${modLabel(mod)})`}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="mt-3 text-sm text-neblirDanger-300">{error}</p>}
    </ModalShell>
  );
}
