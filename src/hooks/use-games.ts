import { gameListItemSchema, type GameListItem } from "@/app/lib/types/game";
import useSWR from "swr";
import { z } from "zod";

const gameListSchema = z.array(gameListItemSchema);

type UseGamesResult = {
  games: GameListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: ReturnType<typeof useSWR<unknown[]>>["mutate"];
};

export function useGames(): UseGamesResult {
  const { data, error, isLoading, mutate } = useSWR<unknown[]>("/api/games");

  const parseResult = gameListSchema.safeParse(data);
  const payloadError =
    data && !parseResult.success
      ? "Game list payload did not match expected shape"
      : null;

  const refetch = async () => {
    await mutate();
  };

  return {
    games: parseResult.success ? parseResult.data : [],
    loading: isLoading,
    error: payloadError ?? (error instanceof Error ? error.message : null),
    refetch,
    mutate,
  };
}
