import {
  type ItemResponse,
  type ItemStatus,
  itemListResponseSchema,
  itemResponseSchema,
} from "@/app/lib/types/item";
import {
  itemCharacterSchema,
  type ItemCharacter,
} from "@/app/lib/types/character";
import {
  readApiErrorBody,
  responseShapeError,
  type ApiErrorPayload,
} from "@/lib/api/responseShape";
import { getUserSafeApiError } from "@/lib/userSafeError";

/** Item as returned from GET /api/items (includes id) */
export type ItemWithId = ItemResponse;

export type InventoryEntry = ItemCharacter;

export async function getItems(signal?: AbortSignal): Promise<ItemWithId[]> {
  const response = await fetch("/api/items", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to fetch items"
      )
    );
  }

  const json = await response.json();
  const parsed = itemListResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw responseShapeError("Items", parsed.error);
  }
  return parsed.data as ItemWithId[];
}

export async function getItem(
  id: string,
  signal?: AbortSignal
): Promise<ItemWithId> {
  const response = await fetch(`/api/items/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readApiErrorBody(response),
        "Failed to fetch item"
      )
    );
  }

  const json: unknown = await response.json();
  const parsed = itemResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw responseShapeError("Item", parsed.error);
  }
  return parsed.data;
}

export type AddToInventoryBody = {
  sourceType: "GLOBAL_ITEM" | "CUSTOM_ITEM" | "UNIQUE_ITEM";
  itemId: string;
  quantity?: number;
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

type EquipSlot = "HAND" | "FOOT" | "BODY" | "HEAD" | "BRAIN";

export type UpdateInventoryEntryBody =
  | { action: "equip"; slot?: EquipSlot }
  | { action: "unequip"; slot: EquipSlot }
  | { action: "unequipAll" }
  | { action: "take" }
  | { action: "leave"; placeName: string; gameId?: string | null }
  | { action: "setCurrentUses"; currentUses: number }
  | { action: "decrementUse" }
  | { action: "setStatus"; status: ItemStatus }
  | { action: "setQuantity"; quantity: number }
  | { action: "setCustomName"; customName: string | null };

export async function updateCharacterInventoryEntry(
  characterId: string,
  itemCharacterId: string,
  body: UpdateInventoryEntryBody
): Promise<InventoryEntry | null> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/inventory/${encodeURIComponent(itemCharacterId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    let errorBody: ApiErrorPayload | undefined;
    try {
      errorBody = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      getUserSafeApiError(
        response.status,
        errorBody,
        "Failed to update inventory entry"
      )
    );
  }

  if (response.status === 204) {
    return null;
  }

  const json = await response.json();
  const parsed = itemCharacterSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Inventory entry response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
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
