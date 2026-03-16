import { gameDetailSchema, type GameDetail } from "@/app/lib/types/game";
import { getUserSafeApiError } from "@/lib/userSafeError";

type ApiErrorPayload = { message?: string; details?: string };

export async function getGameById(
  id: string,
  signal?: AbortSignal
): Promise<GameDetail> {
  const response = await fetch(`/api/games/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal,
  });

  if (!response.ok) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      getUserSafeApiError(response.status, body, "Failed to fetch game")
    );
  }

  const json = await response.json();
  const parsed = gameDetailSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Game response did not match expected shape: ${details}`);
  }
  return parsed.data;
}

type GameUpdateBody = {
  name?: string;
  imageKey?: string | null;
  nextSession?: string | null; // ISO date string
  lore?: string | null;
};

export async function updateGame(
  id: string,
  body: GameUpdateBody
): Promise<GameDetail> {
  const response = await fetch(`/api/games/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      getUserSafeApiError(response.status, body, "Failed to update game")
    );
  }

  const json = await response.json();
  const parsed = gameDetailSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Game response did not match expected shape");
  }
  return parsed.data;
}

export type GiveItemToCharacterBody = {
  characterId: string;
  sourceType: "GLOBAL_ITEM" | "CUSTOM_ITEM" | "UNIQUE_ITEM";
  itemId: string;
};

export async function giveItemToCharacter(
  gameId: string,
  body: GiveItemToCharacterBody
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/give-item`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    let bodyPayload: ApiErrorPayload | undefined;
    try {
      bodyPayload = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      getUserSafeApiError(
        response.status,
        bodyPayload,
        "Failed to give item to character"
      )
    );
  }
}
