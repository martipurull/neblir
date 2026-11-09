import {
  customBotListResponseSchema,
  customBotResponseSchema,
  type CustomBotCreateBody,
  type CustomBotResponse,
  type CustomBotUpdate,
} from "@/app/lib/types/bot";
import { readApiErrorBody, responseShapeError } from "@/lib/api/responseShape";
import { getUserSafeApiError } from "@/lib/userSafeError";

export async function fetchGameCustomBots(
  gameId: string,
  signal?: AbortSignal
): Promise<CustomBotResponse[]> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/custom-bots`,
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
        "Failed to load custom bots"
      )
    );
  }
  const parsed = customBotListResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Custom bots", parsed.error);
  }
  return parsed.data;
}

export async function getGameCustomBot(
  gameId: string,
  botId: string,
  signal?: AbortSignal
): Promise<CustomBotResponse> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/custom-bots/${encodeURIComponent(botId)}`,
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
        "Failed to load custom bot"
      )
    );
  }
  const parsed = customBotResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Custom bot", parsed.error);
  }
  return parsed.data;
}

export async function createGameCustomBot(
  gameId: string,
  body: CustomBotCreateBody
): Promise<CustomBotResponse> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/custom-bots`,
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
        "Failed to create custom bot"
      )
    );
  }
  const parsed = customBotResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Custom bot", parsed.error);
  }
  return parsed.data;
}

export async function updateGameCustomBot(
  gameId: string,
  botId: string,
  body: CustomBotUpdate
): Promise<CustomBotResponse> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/custom-bots/${encodeURIComponent(botId)}`,
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
        "Failed to update custom bot"
      )
    );
  }
  const parsed = customBotResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Custom bot", parsed.error);
  }
  return parsed.data;
}
