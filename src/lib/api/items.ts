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

export type EquipSlot = "HAND" | "FOOT" | "BODY";

export async function updateCharacterInventoryEntry(
  characterId: string,
  itemCharacterId: string,
  body: { equipSlot: EquipSlot | null }
): Promise<void> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/inventory/${encodeURIComponent(itemCharacterId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    let errorMessage = "Failed to update inventory entry";
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

export async function deleteCharacterInventoryEntry(
  characterId: string,
  itemCharacterId: string
): Promise<void> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/inventory/${encodeURIComponent(itemCharacterId)}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    let errorMessage = "Failed to remove item from inventory";
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
