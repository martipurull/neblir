import { CurrentUser, currentUserSchema } from "@/app/lib/types/user";
import useSWR from "swr";

type UseUserResult = {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useUser(): UseUserResult {
  const { data, error, isLoading, mutate } =
    useSWR<CurrentUser>("/api/users/me");

  const parseResult = currentUserSchema.safeParse(data);
  const payloadError =
    data && !parseResult.success
      ? "Current user payload did not match expected shape"
      : null;

  const refetch = async () => {
    await mutate();
  };

  return {
    user: parseResult.success ? parseResult.data : null,
    loading: isLoading,
    error: payloadError || (error instanceof Error ? error.message : null),
    refetch,
  };
}
