import {
  characterDetailSchema,
  type CharacterDetail,
} from "@/app/lib/types/character";

type ApiErrorPayload = {
  message?: string;
  details?: string;
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
    let errorMessage = "Failed to fetch character";
    try {
      const errorPayload = (await response.json()) as ApiErrorPayload;
      errorMessage =
        errorPayload.details ?? errorPayload.message ?? errorMessage;
    } catch {
      // keep fallback
    }
    throw new Error(errorMessage);
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
    let errorMessage = "Failed to update health";
    try {
      const errorPayload = (await response.json()) as ApiErrorPayload;
      errorMessage =
        errorPayload.details ?? errorPayload.message ?? errorMessage;
    } catch {
      // keep fallback
    }
    throw new Error(errorMessage);
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
    let errorMessage = "Failed to update combat info";
    try {
      const errorPayload = (await response.json()) as ApiErrorPayload;
      errorMessage =
        errorPayload.details ?? errorPayload.message ?? errorMessage;
    } catch {
      // keep fallback
    }
    throw new Error(errorMessage);
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
    let errorMessage = "Failed to add currency";
    try {
      const errorPayload = (await response.json()) as ApiErrorPayload;
      errorMessage =
        errorPayload.details ?? errorPayload.message ?? errorMessage;
    } catch {
      // keep fallback
    }
    throw new Error(errorMessage);
  }

  const json = (await response.json()) as Array<{
    currencyName: string;
    quantity: number;
  }>;
  return json.map((e) => ({
    currencyName: e.currencyName,
    quantity: e.quantity,
  }));
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
    let errorMessage = "Failed to subtract currency";
    try {
      const errorPayload = (await response.json()) as ApiErrorPayload;
      errorMessage =
        errorPayload.details ?? errorPayload.message ?? errorMessage;
    } catch {
      // keep fallback
    }
    throw new Error(errorMessage);
  }

  const json = (await response.json()) as Array<{
    currencyName: string;
    quantity: number;
  }>;
  return json.map((e) => ({
    currencyName: e.currencyName,
    quantity: e.quantity,
  }));
}
