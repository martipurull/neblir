import type { GameDetail } from "@/app/lib/types/game";

type GameCharacterRow = NonNullable<GameDetail["characters"]>[number];

/**
 * Characters the GM may roll initiative for: no in-game player owners, or only the GM is linked.
 */
export function isGmControlledFromOwnerIds(
  linkedUserIds: string[],
  gameUserIds: ReadonlySet<string>,
  gameMaster: string
): boolean {
  const ownersAmongGameUsers = linkedUserIds.filter((uid) =>
    gameUserIds.has(uid)
  );
  if (ownersAmongGameUsers.length === 0) return true;
  return ownersAmongGameUsers.every((uid) => uid === gameMaster);
}

export function isGmControlledGameCharacter(
  gc: GameCharacterRow,
  game: GameDetail
): boolean {
  const gameUserIds = new Set(game.users.map((u) => u.userId));
  const linked = gc.character.linkedUserIds ?? [];
  return isGmControlledFromOwnerIds(linked, gameUserIds, game.gameMaster);
}

/** GM-controlled NPC with a public game link (visible on Known NPCs to players). */
export function isPublicKnownNpcInGame(
  gc: GameCharacterRow,
  game: GameDetail
): boolean {
  if (!isGmControlledGameCharacter(gc, game)) return false;
  return gc.isPublic !== false;
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

/** Current viewer's play grants on GM-controlled characters in this game. */
export function isHeldPlayGrantInGame(
  gc: GameCharacterRow,
  game: GameDetail
): boolean {
  return game.isGameMaster !== true && gc.playGrant != null;
}

/** Pin granted NPCs first within a public or private list. */
export function sortGrantedNpcsFirst<T extends { playGrant?: unknown }>(
  rows: T[]
): T[] {
  return [...rows].sort(
    (a, b) => Number(b.playGrant != null) - Number(a.playGrant != null)
  );
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
