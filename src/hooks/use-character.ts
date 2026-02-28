import type { CharacterDetail } from "@/app/lib/types/character";
import { getCharacterById } from "@/lib/api/character";
import useSWR from "swr";

type UseCharacterResult = {
  character: CharacterDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useCharacter(id: string | null): UseCharacterResult {
  const { data, error, isLoading, mutate } = useSWR<CharacterDetail | null>(
    id ? ["character", id] : null,
    ([, characterId]) => getCharacterById(characterId as string)
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
