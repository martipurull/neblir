import {
  botHoldingSchema,
  uniqueBotCreateResponseSchema,
  uniqueBotDetailResponseSchema,
  uniqueBotListResponseSchema,
  uniqueBotUpdateResponseSchema,
  type BotHolding,
  type UniqueBotCreate,
  type UniqueBotCreateResponse,
  type UniqueBotDetailResponse,
  type UniqueBotListItem,
  type UniqueBotUpdate,
  type UniqueBotUpdateResponse,
} from "@/app/lib/types/bot";
import { readApiErrorBody, responseShapeError } from "@/lib/api/responseShape";
import { getUserSafeApiError } from "@/lib/userSafeError";

export async function getGameUniqueBots(
  gameId: string,
  signal?: AbortSignal
): Promise<UniqueBotListItem[]> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/unique-bots`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal,
    }
  );
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to load unique bots"
      )
    );
  }
  const parsed = uniqueBotListResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Unique bots", parsed.error);
  }
  return parsed.data;
}

export async function getUniqueBotById(
  uniqueBotId: string,
  signal?: AbortSignal
): Promise<UniqueBotDetailResponse> {
  const response = await fetch(
    `/api/unique-bots/${encodeURIComponent(uniqueBotId)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal,
    }
  );
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to load unique bot"
      )
    );
  }
  const parsed = uniqueBotDetailResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Unique bot", parsed.error);
  }
  return parsed.data;
}

export async function createUniqueBot(
  body: UniqueBotCreate
): Promise<UniqueBotCreateResponse> {
  const response = await fetch("/api/unique-bots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to mint unique bot"
      )
    );
  }
  const parsed = uniqueBotCreateResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Unique bot", parsed.error);
  }
  return parsed.data;
}

export async function mintUniqueBotForCharacter(
  characterId: string,
  body: UniqueBotCreate
): Promise<BotHolding> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/unique-bots`,
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
        await readApiErrorBody(response),
        "Failed to mint unique bot"
      )
    );
  }
  const parsed = botHoldingSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Bot holding", parsed.error);
  }
  return parsed.data;
}

export async function updateUniqueBot(
  uniqueBotId: string,
  body: UniqueBotUpdate
): Promise<UniqueBotUpdateResponse> {
  const response = await fetch(
    `/api/unique-bots/${encodeURIComponent(uniqueBotId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to update unique bot"
      )
    );
  }
  const parsed = uniqueBotUpdateResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Unique bot", parsed.error);
  }
  return parsed.data;
}
