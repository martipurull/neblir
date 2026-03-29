import type { GameDetail } from "@/app/lib/types/game";

type GameCharacterRow = NonNullable<GameDetail["characters"]>[number];

/**
 * Characters the GM may roll initiative for: no in-game player owners, or only the GM is linked.
 */
export function isGmControlledGameCharacter(
  gc: GameCharacterRow,
  game: GameDetail
): boolean {
  const gameUserIds = new Set(game.users.map((u) => u.userId));
  const linked = gc.character.linkedUserIds ?? [];
  const ownersAmongGameUsers = linked.filter((uid: string) =>
    gameUserIds.has(uid)
  );
  if (ownersAmongGameUsers.length === 0) return true;
  return ownersAmongGameUsers.every((uid: string) => uid === game.gameMaster);
}
