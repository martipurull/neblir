"use client";

import type { CharacterDetail } from "@/app/lib/types/character";
import { getGameCharacterForGmView } from "@/lib/api/game";
import useSWR from "swr";

type UseGameCharacterViewResult = {
  character: CharacterDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useGameCharacterView(
  gameId: string | null,
  characterId: string | null
): UseGameCharacterViewResult {
  const { data, error, isLoading, mutate } = useSWR<CharacterDetail | null>(
    gameId && characterId ? ["game-character-view", gameId, characterId] : null,
    ([, gId, cId]) => getGameCharacterForGmView(gId as string, cId as string)
  );

  const refetch = async () => {
    await mutate();
  };

  return {
    character: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}
