import { mapListSchema, type GameMap } from "@/app/lib/types/map";
import { getUserSafeApiError } from "@/lib/userSafeError";

type ApiErrorPayload = { message?: string; details?: string };

async function readErrorBody(
  response: Response
): Promise<ApiErrorPayload | undefined> {
  try {
    return (await response.json()) as ApiErrorPayload;
  } catch {
    return undefined;
  }
}

export type MapListParams = {
  gameId?: string;
};

export async function getMaps(
  params: MapListParams = {},
  signal?: AbortSignal
): Promise<GameMap[]> {
  const searchParams = new URLSearchParams();
  if (params.gameId) searchParams.set("gameId", params.gameId);

  const query = searchParams.toString();
  const response = await fetch(`/api/maps${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to fetch maps"
      )
    );
  }

  const parsed = mapListSchema.safeParse(await response.json());
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Maps response did not match expected shape: ${details}`);
  }

  return parsed.data;
}
