import useSWR from "swr";

export type GameInviteItem = {
  gameId: string;
  gameName: string;
  invitedByName: string;
  createdAt: string;
};

type UseGameInvitesResult = {
  invites: GameInviteItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: ReturnType<typeof useSWR<GameInviteItem[]>>["mutate"];
};

export function useGameInvites(): UseGameInvitesResult {
  const { data, error, isLoading, mutate } =
    useSWR<GameInviteItem[]>("/api/games/invites");

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
