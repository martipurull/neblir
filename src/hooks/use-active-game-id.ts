"use client";

import {
  readStoredActiveGameId,
  writeStoredActiveGameId,
} from "@/app/lib/characterActiveGame";
import type { CharacterDetail } from "@/app/lib/types/character";
import { useCallback, useMemo, useState } from "react";

type GameLink = NonNullable<CharacterDetail["games"]>[number];

export function useActiveGameId(
  characterId: string | null,
  gameLinks: GameLink[] | null | undefined
) {
  const links = useMemo(() => gameLinks ?? [], [gameLinks]);
  const linkedIds = useMemo(() => links.map((g) => g.gameId), [links]);
  const defaultGameId = linkedIds[0] ?? null;

  /** Bumped after writes so we re-read localStorage on the next render. */
  const [storageEpoch, setStorageEpoch] = useState(0);

  const storedGameId = useMemo(() => {
    void storageEpoch;
    if (!characterId || linkedIds.length === 0) return null;
    return readStoredActiveGameId(characterId, linkedIds);
  }, [characterId, linkedIds, storageEpoch]);

  const activeGameId = useMemo(() => {
    if (storedGameId && linkedIds.includes(storedGameId)) {
      return storedGameId;
    }
    return defaultGameId;
  }, [storedGameId, linkedIds, defaultGameId]);

  const setActiveGameId = useCallback(
    (gameId: string) => {
      if (!characterId || !linkedIds.includes(gameId)) return;
      writeStoredActiveGameId(characterId, gameId);
      setStorageEpoch((epoch) => epoch + 1);
    },
    [characterId, linkedIds]
  );

  const gameOptions = useMemo(
    () =>
      links.map((g) => ({
        value: g.gameId,
        label: g.game?.name ?? g.gameId,
      })),
    [links]
  );

  return {
    activeGameId,
    setActiveGameId,
    gameOptions,
    linkedGameCount: linkedIds.length,
  };
}
