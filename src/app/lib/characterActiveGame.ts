const STORAGE_PREFIX = "neblir:activeGame:";

export function getActiveGameStorageKey(characterId: string): string {
  return `${STORAGE_PREFIX}${characterId}`;
}

/**
 * Returns a stored active game id when it is still among the character's linked games.
 */
function storageAvailable(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

export function readStoredActiveGameId(
  characterId: string,
  linkedGameIds: readonly string[]
): string | null {
  if (!storageAvailable()) return null;
  try {
    const raw = localStorage.getItem(getActiveGameStorageKey(characterId));
    if (!raw) return null;
    return linkedGameIds.includes(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredActiveGameId(
  characterId: string,
  gameId: string
): void {
  if (!storageAvailable()) return;
  try {
    localStorage.setItem(getActiveGameStorageKey(characterId), gameId);
  } catch {
    // ignore quota / private mode
  }
}
