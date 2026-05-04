import {
  gameRecapDownloadSchema,
  gameRecapListSchema,
  gameRecapSchema,
  type GameRecap,
  type GameRecapCreate,
} from "@/app/lib/types/recap";
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

export async function getGameRecaps(gameId: string): Promise<GameRecap[]> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/recaps`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to fetch recaps"
      )
    );
  }
  return gameRecapListSchema.parse(await response.json());
}

export async function createGameRecap(
  gameId: string,
  body: GameRecapCreate
): Promise<GameRecap> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/recaps`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to create recap"
      )
    );
  }
  return gameRecapSchema.parse(await response.json());
}

export async function deleteGameRecap(
  gameId: string,
  recapId: string
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/recaps/${encodeURIComponent(recapId)}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to delete recap"
      )
    );
  }
}

export async function getRecapDownloadUrl(recapId: string): Promise<string> {
  const response = await fetch(
    `/api/recap-url?recapId=${encodeURIComponent(recapId)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to get recap download URL"
      )
    );
  }
  const parsed = gameRecapDownloadSchema.parse(await response.json());
  return parsed.url;
}
