import type { GameListItem } from "@/app/lib/types/game";
import { getGames } from "@/lib/api/game";
import useSWR from "swr";

type UseGamesResult = {
  games: GameListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: ReturnType<typeof useSWR<GameListItem[]>>["mutate"];
};

export function useGames(): UseGamesResult {
  const { data, error, isLoading, mutate } = useSWR<GameListItem[]>(
    "/api/games",
    () => getGames()
  );

  const refetch = async () => {
    await mutate();
  };

  return {
    games: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    mutate,
  };
}
