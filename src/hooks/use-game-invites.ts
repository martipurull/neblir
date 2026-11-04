import type { ReceivedGameInvite } from "@/app/lib/types/game";
import { fetchReceivedGameInvites } from "@/lib/api/game";
import useSWR from "swr";

export type GameInviteItem = ReceivedGameInvite;

type UseGameInvitesResult = {
  invites: GameInviteItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: ReturnType<typeof useSWR<GameInviteItem[]>>["mutate"];
};

export function useGameInvites(): UseGameInvitesResult {
  const { data, error, isLoading, mutate } = useSWR<GameInviteItem[]>(
    "/api/games/invites",
    () => fetchReceivedGameInvites()
  );

  const refetch = async () => {
    await mutate();
  };

  return {
    invites: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    mutate,
  };
}
