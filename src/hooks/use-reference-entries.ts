import type {
  ReferenceCategory,
  ReferenceEntry,
} from "@/app/lib/types/reference";
import { getReferenceEntries } from "@/lib/api/referenceEntries";
import useSWR from "swr";

type UseReferenceEntriesParams = {
  category?: ReferenceCategory;
  gameId?: string;
};

type UseReferenceEntriesResult = {
  entries: ReferenceEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useReferenceEntries({
  category,
  gameId,
}: UseReferenceEntriesParams): UseReferenceEntriesResult {
  const key = category
    ? ["/api/reference-entries", category, gameId ?? ""]
    : null;
  const { data, error, isLoading, mutate } = useSWR<ReferenceEntry[]>(key, () =>
    getReferenceEntries({ category, gameId })
  );

  return {
    entries: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => {
      await mutate();
    },
  };
}
