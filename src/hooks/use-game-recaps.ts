import type { GameRecap } from "@/app/lib/types/recap";
import { getGameRecaps } from "@/lib/api/recaps";
import useSWR from "swr";

type UseGameRecapsResult = {
  recaps: GameRecap[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useGameRecaps(gameId: string | null): UseGameRecapsResult {
  const { data, error, isLoading, mutate } = useSWR<GameRecap[]>(
    gameId ? ["game-recaps", gameId] : null,
    ([, id]) => getGameRecaps(id as string)
  );

  return {
    recaps: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => {
      await mutate();
    },
  };
}
