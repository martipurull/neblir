import {
  botHoldingSchema,
  officialBotListResponseSchema,
  officialBotResponseSchema,
  type AddBotToCharacter,
  type BotHolding,
  type BotHoldingPatch,
  type BotPlace,
  type GiveBot,
  type OfficialBot,
} from "@/app/lib/types/bot";
import { readApiErrorBody, responseShapeError } from "@/lib/api/responseShape";
import { getUserSafeApiError } from "@/lib/userSafeError";

export async function getHoldableBots(
  characterId: string,
  signal?: AbortSignal
): Promise<OfficialBot[]> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/bot-templates`,
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
        "Failed to load bots"
      )
    );
  }

  const parsed = officialBotListResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Bots", parsed.error);
  }
  return parsed.data;
}

export async function getGameOfficialBots(
  gameId: string,
  signal?: AbortSignal
): Promise<OfficialBot[]> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/official-bots`,
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
        "Failed to load bots"
      )
    );
  }

  const parsed = officialBotListResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Bots", parsed.error);
  }
  return parsed.data;
}

export async function getCatalogueBots(
  signal?: AbortSignal
): Promise<OfficialBot[]> {
  const response = await fetch("/api/bots", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to load bots"
      )
    );
  }

  const parsed = officialBotListResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Bots", parsed.error);
  }
  return parsed.data;
}

export async function getCatalogueBot(
  id: string,
  signal?: AbortSignal
): Promise<OfficialBot> {
  const response = await fetch(`/api/bots/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to load bot"
      )
    );
  }

  const parsed = officialBotResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Bot", parsed.error);
  }
  return parsed.data;
}

export async function addBotToCharacter(
  characterId: string,
  body: AddBotToCharacter
): Promise<BotHolding> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/bots`,
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
        "Failed to add bot"
      )
    );
  }

  const parsed = botHoldingSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Bot holding", parsed.error);
  }
  return parsed.data;
}

export async function updateCharacterBotHolding(
  characterId: string,
  botCharacterId: string,
  body: BotHoldingPatch
): Promise<BotHolding> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/bots/${encodeURIComponent(botCharacterId)}`,
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
        "Failed to update bot"
      )
    );
  }

  const parsed = botHoldingSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Bot holding", parsed.error);
  }
  return parsed.data;
}

export async function placeItemOnCharacterBot(
  characterId: string,
  botCharacterId: string,
  body: { itemCharacterId: string; place: BotPlace }
): Promise<BotHolding> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/bots/${encodeURIComponent(botCharacterId)}/placements`,
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
        "Failed to place item on bot"
      )
    );
  }
  const parsed = botHoldingSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Bot holding", parsed.error);
  }
  return parsed.data;
}

export async function returnBotItemToCarried(
  characterId: string,
  botCharacterId: string,
  itemCharacterId: string
): Promise<BotHolding> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/bots/${encodeURIComponent(botCharacterId)}/placements/${encodeURIComponent(itemCharacterId)}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to return item"
      )
    );
  }
  const parsed = botHoldingSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Bot holding", parsed.error);
  }
  return parsed.data;
}

export async function removeCharacterBotHolding(
  characterId: string,
  botCharacterId: string
): Promise<void> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/bots/${encodeURIComponent(botCharacterId)}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to remove bot"
      )
    );
  }
}

export async function giveBotToCharacter(
  gameId: string,
  body: GiveBot
): Promise<BotHolding> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/give-bot`,
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
        "Failed to give bot"
      )
    );
  }
  const parsed = botHoldingSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Bot holding", parsed.error);
  }
  return parsed.data;
}

export async function transferCharacterBotHolding(
  characterId: string,
  botCharacterId: string,
  toCharacterId: string
): Promise<void> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/bots/${encodeURIComponent(botCharacterId)}/transfer`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toCharacterId }),
    }
  );
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to give bot"
      )
    );
  }
}
