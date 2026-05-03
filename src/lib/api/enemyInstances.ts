type ApiErrorPayload = { message?: string; details?: string };

type EnemyInstancePatch = {
  name?: string;
  description?: string | null;
  notes?: string;
  imageKey?: string | null;
  currentHealth?: number;
  maxHealth?: number;
  speed?: number;
  initiativeModifier?: number;
  reactionsPerRound?: number;
  reactionsRemaining?: number;
  status?: "ACTIVE" | "DEFEATED" | "DEAD";
};

export type EnemyInstanceDetailResponse = {
  id: string;
  gameId: string;
  name: string;
  imageKey?: string | null;
  currentHealth: number;
  maxHealth: number;
  reactionsRemaining: number;
  reactionsPerRound: number;
  status: "ACTIVE" | "DEFEATED" | "DEAD";
  speed: number;
  initiativeModifier: number;
  description?: string | null;
  notes?: string | null;
  defenceMelee: number;
  defenceRange: number;
  defenceGrid: number;
  attackMelee: number;
  attackRange: number;
  attackThrow: number;
  attackGrid: number;
  actions: Array<{
    name: string;
    description?: string;
    numberOfDiceToHit?: number;
    numberOfDamageDice?: number;
    damageDiceType?: number;
    damageType?: string;
    notes?: string;
  }>;
  additionalActions: Array<{
    name: string;
    description?: string;
    numberOfDiceToHit?: number;
    numberOfDamageDice?: number;
    damageDiceType?: number;
    damageType?: string;
    notes?: string;
  }>;
};

function getMessage(
  payload: ApiErrorPayload | undefined,
  status: number,
  fallback: string
) {
  return payload?.message ?? `${fallback} (${status})`;
}

export type SpawnEnemyInstancesBody =
  | {
      sourceCustomEnemyId: string;
      count?: number;
      nameOverride?: string;
      sourceOfficialEnemyId?: undefined;
    }
  | {
      sourceOfficialEnemyId: string;
      count?: number;
      nameOverride?: string;
      sourceCustomEnemyId?: undefined;
    };

export async function spawnEnemyInstances(
  gameId: string,
  body: SpawnEnemyInstancesBody
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/enemy-instances`,
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
    throw new Error(getMessage(payload, response.status, "Spawn failed"));
  }
}

export async function updateEnemyInstance(
  gameId: string,
  instanceId: string,
  patch: EnemyInstancePatch
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/enemy-instances/${encodeURIComponent(instanceId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }
  );
  if (!response.ok) {
    let payload: ApiErrorPayload | undefined;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(getMessage(payload, response.status, "Update failed"));
  }
}

export async function deleteEnemyInstance(
  gameId: string,
  instanceId: string
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/enemy-instances/${encodeURIComponent(instanceId)}`,
    { method: "DELETE" }
  );
  if (!response.ok && response.status !== 204) {
    let payload: ApiErrorPayload | undefined;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(getMessage(payload, response.status, "Delete failed"));
  }
}

export async function getEnemyInstance(
  gameId: string,
  instanceId: string
): Promise<EnemyInstanceDetailResponse> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/enemy-instances/${encodeURIComponent(instanceId)}`,
    { method: "GET" }
  );
  if (!response.ok) {
    let payload: ApiErrorPayload | undefined;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(getMessage(payload, response.status, "Fetch failed"));
  }
  return response.json() as Promise<EnemyInstanceDetailResponse>;
}
