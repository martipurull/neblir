import {
  uniqueItemListResponseSchema,
  uniqueItemResolvedResponseSchema,
  type UniqueItemResolvedResponse,
} from "@/app/lib/types/item";
import { getUserSafeApiError } from "@/lib/userSafeError";

type ApiErrorPayload = { message?: string; details?: string };

export type UniqueItemListItem = {
  id: string;
  name: string;
};

export async function getGameUniqueItems(
  gameId: string,
  signal?: AbortSignal
): Promise<UniqueItemListItem[]> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/unique-items`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal,
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
      getUserSafeApiError(response.status, body, "Failed to load unique items")
    );
  }

  const json = await response.json();
  const parsed = uniqueItemListResponseSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Unique items response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}

export async function getUniqueItemById(
  uniqueItemId: string,
  signal?: AbortSignal
): Promise<UniqueItemResolvedResponse> {
  const response = await fetch(
    `/api/unique-items/${encodeURIComponent(uniqueItemId)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal,
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
      getUserSafeApiError(response.status, body, "Failed to load unique item")
    );
  }

  const json = await response.json();
  const parsed = uniqueItemResolvedResponseSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Unique item response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}
