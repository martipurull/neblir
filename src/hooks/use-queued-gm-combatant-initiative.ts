import {
  hasCombatantInitiativeEntry,
  submitGmCombatantInitiative,
  type GmCombatantType,
  type SubmitGmCombatantInitiativeInput,
} from "@/app/lib/gmCombatantInitiative";
import { createSerialAsyncQueue } from "@/app/lib/serialAsyncQueue";
import type { GameDetail } from "@/app/lib/types/game";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useCallback, useRef, useState } from "react";

const gameInitiativeRollQueues = new Map<
  string,
  ReturnType<typeof createSerialAsyncQueue>
>();

function getGameInitiativeRollQueue(gameId: string) {
  const existing = gameInitiativeRollQueues.get(gameId);
  if (existing) return existing;
  const created = createSerialAsyncQueue();
  gameInitiativeRollQueues.set(gameId, created);
  return created;
}

function combatantRef(combatantType: GmCombatantType, combatantId: string) {
  return `${combatantType}:${combatantId}`;
}

type UseQueuedGmCombatantInitiativeOptions = {
  game: GameDetail;
  onRolled: (game: GameDetail) => void | Promise<void>;
};

export function useQueuedGmCombatantInitiative({
  game,
  onRolled,
}: UseQueuedGmCombatantInitiativeOptions) {
  const [pendingRefs, setPendingRefs] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [error, setError] = useState<string | null>(null);
  const pendingRefsRef = useRef<ReadonlySet<string>>(pendingRefs);

  const isPending = useCallback(
    (combatantType: GmCombatantType, combatantId: string) =>
      pendingRefs.has(combatantRef(combatantType, combatantId)),
    [pendingRefs]
  );

  const enqueueRoll = useCallback(
    async (input: Omit<SubmitGmCombatantInitiativeInput, "gameId">) => {
      const ref = combatantRef(input.combatantType, input.combatantId);
      if (
        hasCombatantInitiativeEntry(
          game,
          input.combatantType,
          input.combatantId
        ) ||
        pendingRefsRef.current.has(ref)
      ) {
        return;
      }

      const nextPending = new Set(pendingRefsRef.current);
      nextPending.add(ref);
      pendingRefsRef.current = nextPending;
      setPendingRefs(nextPending);
      setError(null);

      try {
        await getGameInitiativeRollQueue(game.id)(async () => {
          const updated = await submitGmCombatantInitiative({
            ...input,
            gameId: game.id,
          });
          await onRolled(updated);
        });
      } catch (err) {
        setError(
          getUserSafeErrorMessage(err, "Could not register initiative.")
        );
      } finally {
        const released = new Set(pendingRefsRef.current);
        released.delete(ref);
        pendingRefsRef.current = released;
        setPendingRefs(released);
      }
    },
    [game, onRolled]
  );

  return { isPending, enqueueRoll, error };
}
