import {
  CharacterListItem,
  characterListSchema,
} from "@/app/lib/types/character";
import useSWR from "swr";

type UseCharactersResult = {
  characters: CharacterListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useCharacters(): UseCharactersResult {
  const { data, error, isLoading, mutate } =
    useSWR<CharacterListItem[]>("/api/characters");

  const parseResult = characterListSchema.safeParse(data);
  const payloadError =
    data && !parseResult.success
      ? "Character list payload did not match expected shape"
      : null;

  const refetch = async () => {
    await mutate();
  };

  return {
    characters: parseResult.success ? parseResult.data : [],
    loading: isLoading,
    error: payloadError || (error instanceof Error ? error.message : null),
    refetch,
  };
}
