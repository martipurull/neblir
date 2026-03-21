import {
  characterCreateResponseSchema,
  characterDetailSchema,
  type CharacterCreateResponse,
  type CharacterDetail,
} from "@/app/lib/types/character";
import { walletSchema } from "@/app/lib/types/item";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import { getUserSafeApiError } from "@/lib/userSafeError";

type ApiErrorPayload = { message?: string; details?: string };

export type CharacterCreateBody = CharacterCreationRequest & {
  initialFeatures?: Array<{ featureId: string; grade: number }>;
};

export async function getCharacterById(
  id: string,
  signal?: AbortSignal
): Promise<CharacterDetail> {
  const response = await fetch(`/api/characters/${encodeURIComponent(id)}`, {
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
      getUserSafeApiError(response.status, body, "Failed to fetch character")
    );
  }

  const json = await response.json();
  const parsed = characterDetailSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Character response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}

export async function createCharacter(
  body: CharacterCreateBody
): Promise<CharacterCreateResponse> {
  const response = await fetch("/api/characters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

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
        "Failed to create character"
      )
    );
  }

  const json = await response.json();
  const parsed = characterCreateResponseSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Create character response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}

type HealthUpdateBody = {
  currentPhysicalHealth?: number;
  currentMentalHealth?: number;
  seriousPhysicalInjuries?: number;
  seriousTrauma?: number;
  deathSaves?: { successes: number; failures: number };
  status?: string;
};

type CombatInfoUpdateBody = {
  armourCurrentHP?: number;
  armourMod?: number;
  GridMod?: number;
};

export async function updateCharacterHealth(
  id: string,
  body: HealthUpdateBody
): Promise<CharacterDetail> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(id)}/health`,
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
      getUserSafeApiError(response.status, body, "Failed to update health")
    );
  }

  const json = await response.json();
  const parsed = characterDetailSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Character response did not match expected shape");
  }
  return parsed.data;
}

export async function updateCharacterCombatInfo(
  id: string,
  body: CombatInfoUpdateBody
): Promise<CharacterDetail> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(id)}/combat-info`,
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
      getUserSafeApiError(response.status, body, "Failed to update combat info")
    );
  }

  const json = await response.json();
  const parsed = characterDetailSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Character response did not match expected shape");
  }
  return parsed.data;
}

export type WalletEntry = { currencyName: string; quantity: number };

export async function addWalletCurrency(
  characterId: string,
  currencyName: string,
  amount: number
): Promise<WalletEntry[]> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/wallet/add`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currencyName, amount }),
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
      getUserSafeApiError(response.status, body, "Failed to add currency")
    );
  }

  const json = await response.json();
  const parsed = walletSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Wallet response did not match expected shape: ${details}`);
  }
  return parsed.data;
}

export async function subtractWalletCurrency(
  characterId: string,
  currencyName: string,
  amount: number
): Promise<WalletEntry[]> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/wallet/subtract`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currencyName, amount }),
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
      getUserSafeApiError(response.status, body, "Failed to subtract currency")
    );
  }

  const json = await response.json();
  const parsed = walletSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Wallet response did not match expected shape: ${details}`);
  }
  return parsed.data;
}
