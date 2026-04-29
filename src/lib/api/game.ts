import {
  gameCreateResponseSchema,
  gameDetailSchema,
  gameListSchema,
  type GameCreateResponse,
  type GameDetail,
  type GameListItem,
} from "@/app/lib/types/game";
import {
  connectDiscordStartResponseSchema,
  discordGuildChannelsResponseSchema,
  saveDiscordIntegrationBodySchema,
} from "@/app/lib/types/discord";
import type { SubmitInitiativeBody } from "@/app/lib/types/initiative";
import type { RollEventPayload } from "@/app/lib/types/roll-event";
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

export type GameCreateBody = {
  name: string;
  premise?: string;
  imageKey?: string;
};

export async function getGames(signal?: AbortSignal): Promise<GameListItem[]> {
  const response = await fetch("/api/games", {
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
      getUserSafeApiError(response.status, body, "Failed to fetch games")
    );
  }

  const json = await response.json();
  const parsed = gameListSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Games response did not match expected shape: ${details}`);
  }
  return parsed.data;
}

export async function createGame(
  body: GameCreateBody
): Promise<GameCreateResponse> {
  const response = await fetch("/api/games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let bodyPayload: ApiErrorPayload | undefined;
    try {
      bodyPayload = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      getUserSafeApiError(response.status, bodyPayload, "Failed to create game")
    );
  }

  const json = await response.json();
  const parsed = gameCreateResponseSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Create game response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}

export async function submitGameInitiative(
  gameId: string,
  body: SubmitInitiativeBody
): Promise<GameDetail> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/initiative`,
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
        "Failed to submit initiative"
      )
    );
  }

  const json = await response.json();
  const parsed = gameDetailSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Game response did not match expected shape");
  }
  return parsed.data;
}

export async function removeGameInitiativeEntry(
  gameId: string,
  characterId: string
): Promise<GameDetail> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/initiative/${encodeURIComponent(characterId)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
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
        "Failed to remove initiative entry"
      )
    );
  }

  const json = await response.json();
  const parsed = gameDetailSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Game response did not match expected shape");
  }
  return parsed.data;
}

export async function adjustGameInitiativeEntry(
  gameId: string,
  characterId: string,
  initiativeDelta: number
): Promise<GameDetail> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/initiative/${encodeURIComponent(characterId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initiativeDelta }),
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
        "Failed to adjust initiative entry"
      )
    );
  }

  const json = await response.json();
  const parsed = gameDetailSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Game response did not match expected shape");
  }
  return parsed.data;
}

export async function clearGameInitiative(gameId: string): Promise<GameDetail> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/initiative`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
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
        "Failed to clear initiative"
      )
    );
  }

  const json = await response.json();
  const parsed = gameDetailSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Game response did not match expected shape");
  }
  return parsed.data;
}

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

export async function emitGameRollEvent(
  gameId: string,
  payload: RollEventPayload
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/roll-events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
        "Failed to publish roll"
      )
    );
  }
}

export async function getDiscordConnectUrl(gameId: string): Promise<string> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/discord/connect`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );
  if (!response.ok) {
    throw new Error("Failed to start Discord OAuth");
  }
  const parsed = connectDiscordStartResponseSchema.safeParse(
    await response.json()
  );
  if (!parsed.success) throw new Error("Invalid Discord connect response");
  return parsed.data.url;
}

export async function getDiscordGuildChannels(
  gameId: string,
  guildId: string
): Promise<Array<{ id: string; name: string; channelType: number }>> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/discord/channels?guildId=${encodeURIComponent(guildId)}`,
    { method: "GET", headers: { "Content-Type": "application/json" } }
  );
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const body = json as ApiErrorPayload | null;
    const detail = body?.details ?? body?.message;
    const fallback =
      response.status === 401
        ? "Not signed in — refresh the page and try again."
        : `Failed to load Discord channels (${response.status})`;
    throw new Error(detail && detail.length > 0 ? detail : fallback);
  }
  const parsed = discordGuildChannelsResponseSchema.safeParse(json);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join("; ");
    throw new Error(`Invalid channels response: ${issues}`);
  }
  return parsed.data.channels;
}

export async function saveGameDiscordIntegration(
  gameId: string,
  payload: { guildId: string; channelId: string }
): Promise<void> {
  const body = saveDiscordIntegrationBodySchema.parse(payload);
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/discord`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) throw new Error("Failed to save Discord integration");
}

export async function disconnectGameDiscordIntegration(
  gameId: string
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/discord`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!response.ok) throw new Error("Failed to disconnect Discord integration");
}

export async function queueGameDiscordTest(gameId: string): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/discord/test`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const body = json as ApiErrorPayload | null;
    const detail = body?.details ?? body?.message;
    const fallback = `Failed to queue Discord test message (${response.status})`;
    throw new Error(detail && detail.length > 0 ? detail : fallback);
  }
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

export async function setGameCharacterVisibility(
  gameId: string,
  characterId: string,
  isPublic: boolean
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/characters`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId, isPublic }),
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
        "Failed to update NPC visibility"
      )
    );
  }
}
