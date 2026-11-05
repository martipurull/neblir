import {
  parseStoredDrawerOpen,
  readStoredDrawerOpenRaw,
  writeStoredDrawerOpen,
} from "@/app/lib/storedInventory";
import { useCallback, useMemo, useSyncExternalStore } from "react";

const EMPTY_RAW = "";

const listeners = new Set<() => void>();

function emitStoredDrawerOpenState() {
  for (const listener of listeners) listener();
}

function subscribeStoredDrawerOpenState(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function readRaw(characterId: string): string {
  try {
    return readStoredDrawerOpenRaw(sessionStorage, characterId);
  } catch {
    return EMPTY_RAW;
  }
}

/** Open or closed Stash drawers for one character, in this browser tab only. */
export function useStoredDrawerOpenState(characterId: string) {
  const raw = useSyncExternalStore(
    subscribeStoredDrawerOpenState,
    () => readRaw(characterId),
    () => EMPTY_RAW
  );
  const openByKey = useMemo(() => parseStoredDrawerOpen(raw), [raw]);

  const setDrawerOpen = useCallback(
    (placeKey: string, open: boolean) => {
      try {
        writeStoredDrawerOpen(sessionStorage, characterId, placeKey, open);
      } catch {
        return;
      }
      emitStoredDrawerOpenState();
    },
    [characterId]
  );

  return { openByKey, setDrawerOpen };
}
