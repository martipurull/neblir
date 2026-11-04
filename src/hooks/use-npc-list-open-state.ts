import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_PREFIX = "neblir:gm-npc-open:v1:";
const EMPTY_RAW = "";

const listeners = new Set<() => void>();

function emitNpcListOpenState() {
  for (const listener of listeners) listener();
}

function subscribeNpcListOpenState(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function storageKeyForGame(gameId: string) {
  return `${STORAGE_PREFIX}${gameId}`;
}

function readNpcListOpenRaw(gameId: string): string {
  try {
    return sessionStorage.getItem(storageKeyForGame(gameId)) ?? EMPTY_RAW;
  } catch {
    return EMPTY_RAW;
  }
}

function parseNpcListOpenState(raw: string): Record<string, boolean> {
  if (raw === "") return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return {};
    }
    const parsed: Record<string, boolean> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry === "boolean") parsed[key] = entry;
    }
    return parsed;
  } catch {
    return {};
  }
}

/** Open or closed NPC groups for one game, remembered in this browser tab only. */
export function useNpcListOpenState(gameId: string) {
  const raw = useSyncExternalStore(
    subscribeNpcListOpenState,
    () => readNpcListOpenRaw(gameId),
    () => EMPTY_RAW
  );
  const openByKey = useMemo(() => parseNpcListOpenState(raw), [raw]);

  const setSectionOpen = useCallback(
    (sectionKey: string, open: boolean) => {
      const next = {
        ...parseNpcListOpenState(readNpcListOpenRaw(gameId)),
        [sectionKey]: open,
      };
      try {
        sessionStorage.setItem(storageKeyForGame(gameId), JSON.stringify(next));
      } catch {
        return;
      }
      emitNpcListOpenState();
    },
    [gameId]
  );

  return { openByKey, setSectionOpen };
}
