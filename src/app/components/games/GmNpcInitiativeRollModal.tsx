"use client";

import { Button } from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { formatSignedModifier } from "@/app/lib/enemyDetailsView";
import { hasCombatantInitiativeEntry } from "@/app/lib/gmCombatantInitiative";
import { isGmControlledGameCharacter } from "@/app/lib/gmUtils";
import { isPrivateGameCharacterLink } from "@/app/lib/roll-privacy";
import type { GameDetail } from "@/app/lib/types/game";
import { useQueuedGmCombatantInitiative } from "@/hooks/use-queued-gm-combatant-initiative";
import { useCallback, useMemo } from "react";

export interface GmNpcInitiativeRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GameDetail;
  onSuccess: (game: GameDetail) => void | Promise<void>;
}

export function GmNpcInitiativeRollModal({
  isOpen,
  onClose,
  game,
  onSuccess,
}: GmNpcInitiativeRollModalProps) {
  const { isPending, enqueueRoll, error } = useQueuedGmCombatantInitiative({
    game,
    onRolled: onSuccess,
  });

  const npcRows = useMemo(
    () =>
      (game.characters ?? []).filter((gc) =>
        isGmControlledGameCharacter(gc, game)
      ),
    [game]
  );

  const handleRoll = useCallback(
    async (
      combatantType: "CHARACTER" | "ENEMY",
      combatantId: string,
      initiativeModifier: number,
      combatantName?: string
    ) => {
      const isPrivate =
        combatantType === "CHARACTER"
          ? isPrivateGameCharacterLink(
              npcRows.find((gc) => gc.character.id === combatantId)?.isPublic
            )
          : isPrivateGameCharacterLink(
              (game.enemyInstances ?? []).find((ei) => ei.id === combatantId)
                ?.isPublic
            );
      await enqueueRoll({
        combatantType,
        combatantId,
        combatantName,
        initiativeModifier,
        isPrivate,
        source: "gmNpcModal",
      });
    },
    [enqueueRoll, game.enemyInstances, npcRows]
  );

  if (!isOpen) return null;

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
                const done = hasCombatantInitiativeEntry(game, "CHARACTER", id);
                const busy = isPending("CHARACTER", id);
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
                          : `Roll (${formatSignedModifier(mod)})`}
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
                const done = hasCombatantInitiativeEntry(game, "ENEMY", id);
                const busy = isPending("ENEMY", id);
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
                          : `Roll (${formatSignedModifier(mod)})`}
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
