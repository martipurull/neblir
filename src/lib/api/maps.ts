import {
  mapListSchema,
  mapSchema,
  type GameMap,
  type GameMapCreate,
  type GameMapUpdate,
} from "@/app/lib/types/map";
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
        await readErrorBody(response),
        "Failed to fetch map"
      )
    );
  }

  return mapSchema.parse(await response.json());
}

export async function createMap(body: GameMapCreate): Promise<GameMap> {
  const response = await fetch("/api/maps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to create map"
      )
    );
  }

  return mapSchema.parse(await response.json());
}

export async function updateMap(
  id: string,
  body: GameMapUpdate
): Promise<GameMap> {
  const response = await fetch(`/api/maps/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to update map"
      )
    );
  }

  return mapSchema.parse(await response.json());
}

export async function deleteMap(id: string): Promise<void> {
  const response = await fetch(`/api/maps/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to delete map"
      )
    );
  }
}
