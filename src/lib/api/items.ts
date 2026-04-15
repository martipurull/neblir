import {
  type ItemResponse,
  itemResponseSchema,
  itemListResponseSchema,
} from "@/app/lib/types/item";
import { getUserSafeApiError } from "@/lib/userSafeError";

/** Item as returned from GET /api/items (includes id) */
export type ItemWithId = ItemResponse;

type ApiErrorPayload = { message?: string; details?: string };

export async function getItems(signal?: AbortSignal): Promise<ItemWithId[]> {
  const response = await fetch("/api/items", {
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
      getUserSafeApiError(response.status, body, "Failed to fetch items")
    );
  }

  const json = await response.json();
  const parsed = itemListResponseSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Items response did not match expected shape: ${details}`);
  }
  return parsed.data as ItemWithId[];
}

export async function getItemById(
  id: string,
  signal?: AbortSignal
): Promise<ItemWithId> {
  const response = await fetch(`/api/items/${encodeURIComponent(id)}`, {
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
      getUserSafeApiError(response.status, body, "Failed to fetch item")
    );
  }

  const json = await response.json();
  const parsed = itemResponseSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Item response did not match expected shape: ${details}`);
  }
  return parsed.data as ItemWithId;
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
        "Failed to add item to inventory"
      )
    );
  }
}

export type EquipSlot = "HAND" | "FOOT" | "BODY" | "HEAD" | "BRAIN";

export type UpdateInventoryEntryBody =
  | { action: "equip"; slot?: EquipSlot }
  | { action: "unequip"; slot: EquipSlot }
  | { action: "unequipAll" }
  | { action: "setLocation"; itemLocation: string }
  | { action: "setCurrentUses"; currentUses: number }
  | { action: "decrementUse" };

export async function updateCharacterInventoryEntry(
  characterId: string,
  itemCharacterId: string,
  body: UpdateInventoryEntryBody
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
        "Failed to update inventory entry"
      )
    );
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
        "Failed to remove item from inventory"
      )
    );
  }
}

export async function transferInventoryItem(
  characterId: string,
  itemCharacterId: string,
  body: { toCharacterId: string; quantity: number }
): Promise<void> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/inventory/${encodeURIComponent(itemCharacterId)}/transfer`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    let payload: ApiErrorPayload | undefined;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      getUserSafeApiError(
        response.status,
        payload,
        "Failed to give item to another character"
      )
    );
  }
}
