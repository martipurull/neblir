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

/** Linked characters owned by a non-GM player in this game. */
export function isPlayerCharacterInGame(
  gc: GameCharacterRow,
  game: GameDetail
): boolean {
  return !isGmControlledGameCharacter(gc, game);
}

/**
 * Linked characters visible in game context: GM sees all; owners see their own;
 * other members only see public links.
 */
function isVisibleLinkedCharacterInGame(
  gc: GameCharacterRow,
  game: GameDetail
): boolean {
  if (game.isGameMaster === true) return true;
  if (gc.character.isOwnedByCurrentUser) return true;
  return gc.isPublic !== false;
}

/**
 * Player characters visible on game hub lists: GM sees all; owners see their own;
 * other members only see public links.
 */
export function isVisiblePlayerCharacterInGame(
  gc: GameCharacterRow,
  game: GameDetail
): boolean {
  if (!isPlayerCharacterInGame(gc, game)) return false;
  return isVisibleLinkedCharacterInGame(gc, game);
}

/** Another character in the same game who may receive an item from `fromCharacterId`. */
export function isGiveItemRecipientInGame(
  gc: GameCharacterRow,
  game: GameDetail,
  fromCharacterId: string
): boolean {
  if (gc.character.id === fromCharacterId) return false;
  return isVisibleLinkedCharacterInGame(gc, game);
}
