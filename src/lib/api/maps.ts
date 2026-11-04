import { mapListSchema, mapSchema, type GameMap } from "@/app/lib/types/map";
import { readApiErrorBody, responseShapeError } from "@/lib/api/responseShape";
import { getUserSafeApiError } from "@/lib/userSafeError";

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
        await readApiErrorBody(response),
        "Failed to fetch maps"
      )
    );
  }

  const parsed = mapListSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Maps", parsed.error);
  }

  return parsed.data;
}

export async function getMap(
  id: string,
  signal?: AbortSignal
): Promise<GameMap> {
  const response = await fetch(`/api/maps/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to fetch map"
      )
    );
  }

  const parsed = mapSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Map", parsed.error);
  }

  return parsed.data;
}
