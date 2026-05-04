import {
  gameImageListSchema,
  gameImageSchema,
  type GameImage,
  type GameImageCreate,
} from "@/app/lib/types/gameImage";
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

export async function getGameImages(gameId: string): Promise<GameImage[]> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/images`,
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
        "Failed to fetch images"
      )
    );
  }
  return gameImageListSchema.parse(await response.json());
}

export async function createGameImage(
  gameId: string,
  body: GameImageCreate
): Promise<GameImage> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/images`,
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
        "Failed to create image"
      )
    );
  }
  return gameImageSchema.parse(await response.json());
}

export async function deleteGameImage(
  gameId: string,
  imageId: string
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/images/${encodeURIComponent(imageId)}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to delete image"
      )
    );
  }
}
