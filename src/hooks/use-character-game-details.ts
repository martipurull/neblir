import type { GameDetail } from "@/app/lib/types/game";
import { getGameById } from "@/lib/api/game";
import { useMemo } from "react";
import useSWR from "swr";

/**
 * Fetches full game detail (including initiative order) for each game the character is linked to.
 */
export function useCharacterGameDetails(
  characterId: string | null,
  gameLinks: { gameId: string }[] | null | undefined
) {
  const sortedIds = useMemo(
    () => [...new Set((gameLinks ?? []).map((g) => g.gameId))].sort(),
    [gameLinks]
  );

  const key =
    characterId && sortedIds.length > 0
      ? ["character-game-details", characterId, ...sortedIds]
      : null;

  const { data, error, isLoading, mutate } = useSWR<GameDetail[]>(
    key,
    async () => {
      const results = await Promise.all(sortedIds.map((id) => getGameById(id)));
      return results;
    }
  );

  return {
    gameDetails: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: mutate,
  };
}
