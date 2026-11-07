import {
  botHoldingSchema,
  officialBotListResponseSchema,
  officialBotResponseSchema,
  type AddBotToCharacter,
  type BotHolding,
  type BotHoldingPatch,
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
