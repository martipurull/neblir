import type { GameDetail } from "@/app/lib/types/game";
import { getGameById } from "@/lib/api/game";
import useSWR from "swr";

type UseGameResult = {
  game: GameDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: ReturnType<typeof useSWR<GameDetail | null>>["mutate"];
};

export function useGame(id: string | null): UseGameResult {
  const { data, error, isLoading, mutate } = useSWR<GameDetail | null>(
    id ? ["game", id] : null,
    ([, gameId]) => getGameById(gameId as string)
  );

  const refetch = async () => {
    await mutate();
  };

  return {
    game: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    mutate,
  };
}
