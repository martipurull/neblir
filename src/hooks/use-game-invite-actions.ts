import { useRouter } from "next/navigation";
import { useState } from "react";

type UseGameInviteActionsArgs = {
  mutateInvites: () => Promise<unknown>;
  mutateGames: () => Promise<unknown>;
};

type UseGameInviteActionsResult = {
  acceptingId: string | null;
  decliningId: string | null;
  handleAccept: (gameId: string) => Promise<void>;
  handleDecline: (gameId: string) => Promise<void>;
};

export function useGameInviteActions({
  mutateInvites,
  mutateGames,
}: UseGameInviteActionsArgs): UseGameInviteActionsResult {
  const router = useRouter();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const handleAccept = async (gameId: string) => {
    setAcceptingId(gameId);
    try {
      const res = await fetch(
        `/api/games/${encodeURIComponent(gameId)}/invites/accept`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to accept");
      await mutateInvites();
      await mutateGames();
      router.push(`/home/games/${gameId}`);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (gameId: string) => {
    setDecliningId(gameId);
    try {
      const res = await fetch(
        `/api/games/${encodeURIComponent(gameId)}/invites/decline`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to decline");
      await mutateInvites();
    } finally {
      setDecliningId(null);
    }
  };

  return { acceptingId, decliningId, handleAccept, handleDecline };
}
