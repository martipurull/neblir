import type { GameFile } from "@/app/lib/types/gameFile";
import { getGameFiles } from "@/lib/api/gameFiles";
import useSWR from "swr";

type UseGameFilesResult = {
  files: GameFile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useGameFiles(gameId: string | null): UseGameFilesResult {
  const { data, error, isLoading, mutate } = useSWR<GameFile[]>(
    gameId ? ["game-files", gameId] : null,
    ([, id]) => getGameFiles(id as string)
  );

  return {
    files: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => {
      await mutate();
    },
  };
}
