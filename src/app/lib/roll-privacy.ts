import type { GameDetail } from "@/app/lib/types/game";

export type RollPrivacyOptions = {
  /** GM may toggle the private-roll checkbox before emitting. */
  allowPrivateRoll: boolean;
  /** Checkbox initial state: true for private (GM-only) NPC links. */
  defaultPrivateRoll: boolean;
};

type GameCharacterLinkRow = NonNullable<GameDetail["characters"]>[number];

/** True when the game link is explicitly private (`isPublic === false`). */
export function isPrivateGameCharacterLink(
  isPublic: boolean | undefined | null
): boolean {
  return isPublic === false;
}

/** Privacy options when the GM rolls for an enemy instance. */
export function getGmRollPrivacyForEnemyInstance(
  isPublic: boolean | undefined | null
): RollPrivacyOptions {
  return {
    allowPrivateRoll: true,
    defaultPrivateRoll: isPrivateGameCharacterLink(isPublic),
  };
}

/** Privacy options when the GM rolls for a linked character in a game. */
export function getGmRollPrivacyForCharacter(
  game: GameDetail | null | undefined,
  characterId: string
): RollPrivacyOptions {
  if (game?.isGameMaster !== true) {
    return { allowPrivateRoll: false, defaultPrivateRoll: false };
  }

  const link = game.characters?.find(
    (gc: GameCharacterLinkRow) => gc.character.id === characterId
  );
  const defaultPrivateRoll = isPrivateGameCharacterLink(link?.isPublic);

  return { allowPrivateRoll: true, defaultPrivateRoll };
}

/** `isPrivate` field for roll-event payloads when the GM toggle is available. */
export function emitIsPrivateFromRollPrivacy(
  rollPrivacy: RollPrivacyOptions,
  isPrivateRoll: boolean
): boolean | undefined {
  if (!rollPrivacy.allowPrivateRoll) return undefined;
  return isPrivateRoll;
}

/**
 * Server-side: honour explicit GM opt-out, explicit private, or default private
 * for GM rolls on private game-character links.
 */
export function enemyInstanceIdFromRollMetadata(
  metadata: Record<string, unknown> | undefined
): string | null {
  if (!metadata) return null;
  const id = metadata.enemyInstanceId;
  if (typeof id !== "string") return null;
  const trimmed = id.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolvePersistedRollIsPrivate(options: {
  requestedIsPrivate: boolean | undefined;
  isGameMaster: boolean;
  /** `false` when link is private; `true` when public; `null` when no character. */
  characterIsPublic: boolean | null;
  /** `false` when instance is private; `true` when public; `null` when no enemy roll. */
  enemyInstanceIsPublic: boolean | null;
}): boolean {
  if (options.requestedIsPrivate === false) return false;
  if (options.requestedIsPrivate === true) return true;
  if (!options.isGameMaster) return false;
  if (options.characterIsPublic === false) return true;
  if (options.enemyInstanceIsPublic === false) return true;
  return false;
}

export function rollMetadataWithPrivateFlag(
  metadata: Record<string, unknown> | undefined,
  isPrivate: boolean
): Record<string, unknown> | undefined {
  if (!isPrivate) return metadata;
  return { ...(metadata ?? {}), isPrivate: true };
}
