"use client";

import Button from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { isGmControlledGameCharacter } from "@/app/lib/gmInitiativeUtils";
import { emitRollEvent } from "@/app/lib/roll-event-client";
import type { GameDetail } from "@/app/lib/types/game";
import { submitGameInitiative } from "@/lib/api/game";
import { useCallback, useMemo, useState } from "react";
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
    (combatantType: "CHARACTER" | "ENEMY", combatantId: string) =>
      (game.initiativeOrder ?? []).some(
        (e) =>
          e.combatantType === combatantType && e.combatantId === combatantId
      ),
    [game.initiativeOrder]
  );

  const handleRoll = useCallback(
    async (
      combatantType: "CHARACTER" | "ENEMY",
      combatantId: string,
      initiativeModifier: number,
      combatantName?: string
    ) => {
      setError(null);
      setRollingId(`${combatantType}:${combatantId}`);
      try {
        const rolledValue = rollD10();
        if (combatantType === "CHARACTER") {
          await submitGameInitiative(game.id, {
            combatantType: "CHARACTER",
            combatantId,
            ...(combatantName?.trim()
              ? { combatantName: combatantName.trim() }
              : {}),
            rolledValue,
            initiativeModifier,
          });
        } else {
          const trimmedName = combatantName?.trim() ?? "";
          await submitGameInitiative(game.id, {
            combatantType: "ENEMY",
            combatantId,
            combatantName: trimmedName.length > 0 ? trimmedName : "Enemy",
            rolledValue,
            initiativeModifier,
          });
        }
        await emitRollEvent(game.id, {
          characterId: combatantType === "CHARACTER" ? combatantId : undefined,
          rollType: "INITIATIVE",
          diceExpression: "1d10",
          results: [rolledValue],
          total: rolledValue + initiativeModifier,
          metadata: {
            initiativeModifier,
            source: "gmNpcModal",
            combatantType,
            combatantId,
            combatantName: combatantName ?? null,
          },
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
  const combinedEnemies = game.enemyInstances ?? [];

  return (
    <ModalShell
      isOpen
      onClose={onClose}
      title="Roll initiative for GM-controlled characters / creatures"
      titleId="gm-npc-initiative-modal-title"
      maxWidthClass="max-w-md"
    >
      <div className="mt-4 space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
            GM-controlled characters
          </p>
          {npcRows.length === 0 ? (
            <p className="mt-2 text-sm text-white/80">
              No GM-controlled characters in this game yet.
            </p>
          ) : (
            <ul className="mt-2 max-h-44 space-y-2 overflow-y-auto">
              {npcRows.map((gc) => {
                const id = gc.character.id;
                const mod = gc.character.initiativeMod ?? 0;
                const name =
                  `${gc.character.name}${gc.character.surname ? ` ${gc.character.surname}` : ""}`.trim();
                const done = hasRolled("CHARACTER", id);
                const busy = rollingId === `CHARACTER:${id}`;
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
                      onClick={() =>
                        void handleRoll("CHARACTER", id, mod, name)
                      }
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
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
            Enemy instances
          </p>
          {combinedEnemies.length === 0 ? (
            <p className="mt-2 text-sm text-white/80">
              No active enemy instances yet.
            </p>
          ) : (
            <ul className="mt-2 max-h-44 space-y-2 overflow-y-auto">
              {combinedEnemies.map((enemy) => {
                const id = enemy.id;
                const mod = enemy.initiativeModifier ?? 0;
                const name = enemy.name;
                const done = hasRolled("ENEMY", id);
                const busy = rollingId === `ENEMY:${id}`;
                return (
                  <li
                    key={`enemy-${id}`}
                    className="flex items-center justify-between gap-2 rounded border border-white/15 bg-black/20 px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-white">
                      {name}
                    </span>
                    <Button
                      type="button"
                      variant="modalCompactWarning"
                      disabled={done || busy}
                      onClick={() => void handleRoll("ENEMY", id, mod, name)}
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
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-neblirDanger-300">{error}</p>}
    </ModalShell>
  );
}
