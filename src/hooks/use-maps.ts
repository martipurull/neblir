import type { GameMap } from "@/app/lib/types/map";
import { getMaps } from "@/lib/api/maps";
import useSWR from "swr";

type UseMapsParams = {
  gameId?: string;
};

type UseMapsResult = {
  maps: GameMap[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useMaps({ gameId }: UseMapsParams = {}): UseMapsResult {
  const key = ["/api/maps", gameId ?? ""];
  const { data, error, isLoading, mutate } = useSWR<GameMap[]>(key, () =>
    getMaps({ gameId })
  );

  return {
    maps: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => {
      await mutate();
    },
  };
}
