import {
  gameCharactersAddResultSchema,
  gameCreateResponseSchema,
  gameDetailSchema,
  gameInviteUsersResultSchema,
  gameListSchema,
  pendingGameInviteListSchema,
  playGrantResponseSchema,
  receivedGameInviteListSchema,
  stashRenameResponseSchema,
  type GameCharactersAddResult,
  type GameCreateResponse,
  type GameDetail,
  type GameInviteUsersResult,
  type GameListItem,
  type PendingGameInvite,
  type PlayGrantResponse,
  type ReceivedGameInvite,
} from "@/app/lib/types/game";
import {
  characterDetailSchema,
  type CharacterDetail,
} from "@/app/lib/types/character";
import {
  connectDiscordStartResponseSchema,
  discordGuildChannelsResponseSchema,
  saveDiscordIntegrationBodySchema,
  type DiscordGuildChannel,
} from "@/app/lib/types/discord";
import type { SubmitInitiativeBody } from "@/app/lib/types/initiative";
import type { RollEventPayload } from "@/app/lib/types/roll-event";
import { getUserSafeApiError } from "@/lib/userSafeError";

type ApiErrorPayload = { message?: string; details?: string };

export async function fetchReceivedGameInvites(): Promise<
  ReceivedGameInvite[]
> {
  const response = await fetch("/api/games/invites", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      getUserSafeApiError(response.status, body, "Failed to fetch game invites")
    );
  }

  const json = await response.json();
  const parsed = receivedGameInviteListSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Game invites response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}

export async function fetchPendingGameInvites(
  gameId: string
): Promise<PendingGameInvite[]> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/invites`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      getUserSafeApiError(
        response.status,
        body,
        "Failed to fetch pending invites"
      )
    );
  }

  const json = await response.json();
  const parsed = pendingGameInviteListSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Pending invites response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}

export async function inviteUsersToGame(
  gameId: string,
  emails: string[]
): Promise<GameInviteUsersResult> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/invites`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails }),
    }
  );

  if (!response.ok) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      getUserSafeApiError(response.status, body, "Failed to send invites.")
    );
  }

  const json = await response.json();
  const parsed = gameInviteUsersResultSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Invite users response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}

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
  premise?: string | null;
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
  combatantRef: string
): Promise<GameDetail> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/initiative/${encodeURIComponent(combatantRef)}`,
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
  combatantRef: string,
  initiativeDelta: number
): Promise<GameDetail> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/initiative/${encodeURIComponent(combatantRef)}`,
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

export async function resetGameCombatReactions(
  gameId: string
): Promise<GameDetail> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/combat/reset-reactions`,
    {
      method: "POST",
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
        "Failed to reset combat reactions"
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

export async function deleteGame(id: string): Promise<void> {
  const response = await fetch(`/api/games/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      getUserSafeApiError(response.status, body, "Failed to delete game")
    );
  }
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
): Promise<DiscordGuildChannel[]> {
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
  quantity?: number;
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

export type GiveVehicleToCharacterBody = {
  characterId: string;
  sourceType: "GLOBAL_VEHICLE" | "CUSTOM_VEHICLE" | "UNIQUE_VEHICLE";
  vehicleId: string;
};

export async function giveVehicleToCharacter(
  gameId: string,
  body: GiveVehicleToCharacterBody
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/give-vehicle`,
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
        "Failed to give vehicle to character"
      )
    );
  }
}

export async function addCharactersToGame(
  gameId: string,
  characters: Array<{ characterId: string; isPublic?: boolean }>
): Promise<GameCharactersAddResult> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/characters`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characters }),
    }
  );

  if (!response.ok) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      getUserSafeApiError(response.status, body, "Failed to add characters.")
    );
  }

  const json = await response.json();
  const parsed = gameCharactersAddResultSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Add characters response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
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
        "Failed to update character visibility"
      )
    );
  }
}

export async function setGameCharacterNpcGroup(
  gameId: string,
  characterId: string,
  npcGroup: string | null
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/characters/${encodeURIComponent(characterId)}/npc-group`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ npcGroup }),
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
        "Failed to update NPC group"
      )
    );
  }
}

export async function renameGameNpcGroup(
  gameId: string,
  from: string,
  npcGroup: string
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/npc-groups`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, npcGroup }),
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
        "Failed to rename NPC group"
      )
    );
  }
}

export async function renameGameStash(
  gameId: string,
  from: string,
  placeName: string
): Promise<string> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/stashes`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, placeName }),
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
        "Failed to rename stash"
      )
    );
  }

  const parsed = stashRenameResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Stash rename response did not match expected shape: ${details}`
    );
  }
  return parsed.data.placeName;
}

async function readPlayGrantResponse(
  response: Response
): Promise<PlayGrantResponse> {
  const json = await response.json();
  const parsed = playGrantResponseSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Play grant response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}

export async function setGameCharacterPlayGrant(
  gameId: string,
  characterId: string,
  userId: string
): Promise<PlayGrantResponse> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/characters/${encodeURIComponent(characterId)}/play-grant`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
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
        "Failed to issue play grant"
      )
    );
  }

  return readPlayGrantResponse(response);
}

export async function revokeGameCharacterPlayGrant(
  gameId: string,
  characterId: string
): Promise<PlayGrantResponse> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/characters/${encodeURIComponent(characterId)}/play-grant`,
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
        "Failed to revoke play grant"
      )
    );
  }

  return readPlayGrantResponse(response);
}

export async function getGameCharacterForGmView(
  gameId: string,
  characterId: string,
  signal?: AbortSignal
): Promise<CharacterDetail> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/characters/${encodeURIComponent(characterId)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal,
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
        "Failed to fetch character"
      )
    );
  }

  const json = (await response.json()) as Record<string, unknown>;
  const parsed = characterDetailSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Character response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}
