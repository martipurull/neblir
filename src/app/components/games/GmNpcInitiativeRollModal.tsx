"use client";

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gm-npc-initiative-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border-2 border-white bg-modalBackground-200 p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            id="gm-npc-initiative-modal-title"
            className="text-lg font-semibold text-white"
          >
            Roll initiative for GM-controlled characters / creatures
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white transition-colors hover:bg-white/10"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        {npcRows.length === 0 ? (
          <p className="mt-4 text-sm text-white/80">
            No GM-controlled characters in this game yet. Add characters that
            only you control (or with no player owners in this game).
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
                  <button
                    type="button"
                    disabled={done || busy}
                    title={
                      done
                        ? "This character has already rolled initiative for this game."
                        : undefined
                    }
                    onClick={() => void handleRoll(id, mod)}
                    className="shrink-0 rounded border border-neblirWarning-200 px-2 py-1 text-xs font-medium text-neblirWarning-200 transition-colors hover:bg-neblirWarning-200/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy
                      ? "Rolling…"
                      : done
                        ? "Rolled"
                        : `Roll (${modLabel(mod)})`}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {error && <p className="mt-3 text-sm text-neblirDanger-300">{error}</p>}
      </div>
    </div>
  );
}
