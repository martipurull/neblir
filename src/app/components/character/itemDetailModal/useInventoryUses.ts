import { updateCharacterInventoryEntry } from "@/lib/api/items";
import type { KeyedMutator } from "swr";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CharacterDetail } from "@/app/lib/types/character";
import { isItemInventoryOperational } from "@/app/lib/types/item";
import type { InventoryEntry } from "./types";
import { USES_DEBOUNCE_MS } from "./utils";

export function useInventoryUses({
  entry,
  characterId,
  mutate,
}: {
  entry: InventoryEntry;
  characterId: string;
  mutate: KeyedMutator<CharacterDetail | null>;
}) {
  const rawMax =
    entry.item && "maxUses" in entry.item
      ? (entry.item as { maxUses?: number | null }).maxUses
      : null;
  const maxUses: number | null = typeof rawMax === "number" ? rawMax : null;
  const operational = isItemInventoryOperational(entry.status);

  const [displayUses, setDisplayUses] = useState(entry.currentUses ?? 0);
  const usesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUsesRef = useRef<number | null>(null);

  useEffect(() => {
    queueMicrotask(() => setDisplayUses(entry.currentUses ?? 0));
  }, [entry.currentUses, entry.id, entry.status]);

  const saveUses = useCallback(async () => {
    const value = pendingUsesRef.current;
    pendingUsesRef.current = null;
    if (value === null || !characterId) return;
    try {
      await updateCharacterInventoryEntry(characterId, entry.id, {
        action: "setCurrentUses",
        currentUses: value,
      });
      await mutate();
    } catch {
      await mutate();
    }
  }, [characterId, entry.id, mutate]);

  const updateUses = useCallback(
    (delta: number) => {
      if (maxUses == null) return;
      if (!operational && delta > 0) return;
      const next = Math.max(0, Math.min(maxUses, (displayUses ?? 0) + delta));
      setDisplayUses(next);
      pendingUsesRef.current = next;
      if (usesTimeoutRef.current) clearTimeout(usesTimeoutRef.current);
      usesTimeoutRef.current = setTimeout(() => {
        usesTimeoutRef.current = null;
        void saveUses();
      }, USES_DEBOUNCE_MS);
    },
    [maxUses, displayUses, saveUses, operational]
  );

  return { maxUses, displayUses, updateUses, canIncreaseUses: operational };
}
