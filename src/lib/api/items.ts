import type { Item } from "@/app/lib/types/item";

/** Item as returned from GET /api/items (includes id) */
export type ItemWithId = Item & { id: string };

type ApiErrorPayload = {
  message?: string;
  details?: string;
};

export async function getItems(signal?: AbortSignal): Promise<ItemWithId[]> {
  const response = await fetch("/api/items", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal,
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch items";
    try {
      const errorPayload = (await response.json()) as ApiErrorPayload;
      errorMessage =
        errorPayload.details || errorPayload.message || errorMessage;
    } catch {
      // keep fallback
    }
    throw new Error(errorMessage);
  }

  const json = await response.json();
  return json as ItemWithId[];
}

export type AddToInventoryBody = {
  sourceType: "GLOBAL_ITEM" | "CUSTOM_ITEM" | "UNIQUE_ITEM";
  itemId: string;
};

export async function addItemToCharacterInventory(
  characterId: string,
  body: AddToInventoryBody
): Promise<void> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/inventory`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    let errorMessage = "Failed to add item to inventory";
    try {
      const errorPayload = (await response.json()) as ApiErrorPayload;
      errorMessage =
        errorPayload.details || errorPayload.message || errorMessage;
    } catch {
      // keep fallback
    }
    throw new Error(errorMessage);
  }
}
