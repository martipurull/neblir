import {
  parseStashDrawerOpen,
  readStashDrawerOpenRaw,
  writeStashDrawerOpen,
} from "@/app/lib/storedInventory";
import { useCallback, useMemo, useSyncExternalStore } from "react";

const EMPTY_RAW = "";

const listeners = new Set<() => void>();

function emitStashDrawerOpenState() {
  for (const listener of listeners) listener();
}

function subscribeStashDrawerOpenState(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function readRaw(characterId: string): string {
  try {
    return readStashDrawerOpenRaw(sessionStorage, characterId);
  } catch {
    return EMPTY_RAW;
  }
}

/** Open or closed stash drawers for one character, in this browser tab only. */
export function useStashDrawerOpenState(characterId: string) {
  const raw = useSyncExternalStore(
    subscribeStashDrawerOpenState,
    () => readRaw(characterId),
    () => EMPTY_RAW
  );
  const openByKey = useMemo(() => parseStashDrawerOpen(raw), [raw]);

  const setStashDrawerOpen = useCallback(
    (stashKey: string, open: boolean) => {
      try {
        writeStashDrawerOpen(sessionStorage, characterId, stashKey, open);
      } catch {
        return;
      }
      emitStashDrawerOpenState();
    },
    [characterId]
  );

  return { openByKey, setStashDrawerOpen };
}
