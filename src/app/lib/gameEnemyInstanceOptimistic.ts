import type { GameDetail } from "@/app/lib/types/game";

export function withRemovedEnemyInstances(
  game: GameDetail,
  instanceIds: readonly string[]
): GameDetail {
  const removed = new Set(instanceIds);
  return {
    ...game,
    enemyInstances: (game.enemyInstances ?? []).filter(
      (row) => !removed.has(row.id)
    ),
    initiativeOrder: (game.initiativeOrder ?? []).filter(
      (entry) =>
        !(entry.combatantType === "ENEMY" && removed.has(entry.combatantId))
    ),
  };
}
