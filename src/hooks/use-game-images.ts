import type { GameImage } from "@/app/lib/types/gameImage";
import { getGameImages } from "@/lib/api/gameImages";
import useSWR from "swr";

type UseGameImagesResult = {
  images: GameImage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useGameImages(gameId: string | null): UseGameImagesResult {
  const { data, error, isLoading, mutate } = useSWR<GameImage[]>(
    gameId ? ["game-images", gameId] : null,
    ([, id]) => getGameImages(id as string)
  );

  return {
    images: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => {
      await mutate();
    },
  };
}
