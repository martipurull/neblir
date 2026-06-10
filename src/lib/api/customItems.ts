import type { ItemBrowseDetailFields } from "@/app/lib/types/itemBrowseDetail";
import {
  customItemListResponseSchema,
  customItemResponseSchema,
  type CustomItemResponse,
  type CustomItemUpdate,
} from "@/app/lib/types/item";
import { getUserSafeApiError } from "@/lib/userSafeError";

type ApiErrorPayload = { message?: string; details?: string };

function mapCustomItemJsonToBrowseDetail(
  data: CustomItemResponse
): ItemBrowseDetailFields {
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    imageKey: data.imageKey ?? null,
    description: data.description ?? null,
    weight: data.weight ?? null,
    confCost: data.confCost ?? null,
    costInfo: data.costInfo ?? null,
    maxUses: data.maxUses ?? null,
    equippable: data.equippable ?? null,
    equipSlotTypes: data.equipSlotTypes ?? null,
    equipSlotCost: data.equipSlotCost ?? null,
    attackRoll: data.attackRoll ?? null,
    attackMeleeBonus: data.attackMeleeBonus ?? null,
    attackRangeBonus: data.attackRangeBonus ?? null,
    attackThrowBonus: data.attackThrowBonus ?? null,
    defenceMeleeBonus: data.defenceMeleeBonus ?? null,
    defenceRangeBonus: data.defenceRangeBonus ?? null,
    gridAttackBonus: data.gridAttackBonus ?? null,
    gridDefenceBonus: data.gridDefenceBonus ?? null,
    effectiveRange: data.effectiveRange ?? null,
    maxRange: data.maxRange ?? null,
    damage: data.damage ?? undefined,
    usage: data.usage ?? null,
    notes: data.notes ?? null,
    modifiesAttribute: data.modifiesAttribute ?? null,
    attributeMod: data.attributeMod ?? null,
    modifiesSkill: data.modifiesSkill ?? null,
    skillMod: data.skillMod ?? null,
    isSpeedAltered: data.isSpeedAltered ?? null,
  };
}

export async function getGameCustomItemRecord(
  gameId: string,
  customItemId: string,
  signal?: AbortSignal
): Promise<CustomItemResponse> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/custom-items/${encodeURIComponent(customItemId)}`,
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
      getUserSafeApiError(response.status, body, "Failed to load custom item")
    );
  }

  const json = await response.json();
  const parsed = customItemResponseSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Custom item response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}

export async function updateGameCustomItem(
  gameId: string,
  customItemId: string,
  body: CustomItemUpdate
): Promise<CustomItemResponse> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/custom-items/${encodeURIComponent(customItemId)}`,
    {
      method: "PATCH",
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
        "Failed to update custom item"
      )
    );
  }

  const json = await response.json();
  const parsed = customItemResponseSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Custom item response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}

export async function getGameCustomItemById(
  gameId: string,
  customItemId: string,
  signal?: AbortSignal
): Promise<ItemBrowseDetailFields> {
  const record = await getGameCustomItemRecord(gameId, customItemId, signal);
  return mapCustomItemJsonToBrowseDetail(record);
}

/** Lists custom items for a game (for browse / add to inventory). Returns [] if the request fails (e.g. no access). */
export async function fetchGameCustomItemsForBrowse(
  gameId: string,
  signal?: AbortSignal
): Promise<ItemBrowseDetailFields[]> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/custom-items`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal,
    }
  );
  if (!response.ok) {
    return [];
  }
  const json = await response.json();
  const parsed = customItemListResponseSchema.safeParse(json);
  if (!parsed.success) {
    return [];
  }
  return parsed.data.map((row) => mapCustomItemJsonToBrowseDetail(row));
}
