import {
  createStaleFetchGuard,
  type StaleFetchGuard,
} from "@/app/lib/staleFetchGuard";
import type { GameDetail } from "@/app/lib/types/game";
import { getGameById } from "@/lib/api/game";
import { useCallback } from "react";
import useSWR from "swr";

/** Poll interval for the live GM page so player initiative rolls appear without a refresh. */
export const GM_LIVE_GAME_REFRESH_MS = 3000;

const gameFetchGuards = new Map<string, StaleFetchGuard<GameDetail>>();

function getGameFetchGuard(gameId: string): StaleFetchGuard<GameDetail> {
  const existing = gameFetchGuards.get(gameId);
  if (existing) return existing;
  const created = createStaleFetchGuard<GameDetail>();
  gameFetchGuards.set(gameId, created);
  return created;
}

type UseGameOptions = {
  refreshInterval?: number;
};

type UseGameResult = {
  game: GameDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: ReturnType<typeof useSWR<GameDetail | null>>["mutate"];
  applyGameUpdate: (updated: GameDetail) => Promise<void>;
  applyOptimisticGameUpdate: (
    optimistic: GameDetail,
    request: () => Promise<GameDetail>
  ) => Promise<GameDetail | undefined>;
};

export function useGame(
  id: string | null,
  options?: UseGameOptions
): UseGameResult {
  const { data, error, isLoading, mutate } = useSWR<GameDetail | null>(
    id ? ["game", id] : null,
    async ([, gameId]: [string, string]) => {
      const guard = getGameFetchGuard(gameId);
      const requestSeq = guard.beginFetch();
      const fetched = await getGameById(gameId);
      return guard.resolveFetch(requestSeq, fetched);
    },
    {
      refreshInterval: options?.refreshInterval,
    }
  );

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const applyGameUpdate = useCallback(
    async (updated: GameDetail) => {
      if (!id) return;
      getGameFetchGuard(id).applyLocal(updated);
      await mutate(updated, { revalidate: false });
    },
    [id, mutate]
  );

  const applyOptimisticGameUpdate = useCallback(
    async (
      optimistic: GameDetail,
      request: () => Promise<GameDetail>
    ): Promise<GameDetail | undefined> => {
      if (!id) return undefined;
      const guard = getGameFetchGuard(id);
      const previous = guard.getCache() ?? data ?? null;
      guard.applyLocal(optimistic);
      await mutate(optimistic, { revalidate: false });
      try {
        const updated = await request();
        guard.applyLocal(updated);
        await mutate(updated, { revalidate: false });
        return updated;
      } catch (err) {
        if (previous) {
          guard.applyLocal(previous);
          await mutate(previous, { revalidate: false });
        } else {
          await mutate();
        }
        throw err;
      }
    },
    [data, id, mutate]
  );

  return {
    game: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    mutate,
    applyGameUpdate,
    applyOptimisticGameUpdate,
  };
}
