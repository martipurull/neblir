import type {
  EnemyInstanceDetailResponse,
  EnemyInstancePatch,
  SpawnEnemyInstancesBody,
} from "@/app/lib/types/enemyInstance";
export type {
  EnemyInstanceDetailResponse,
  EnemyInstancePatch,
  SpawnEnemyInstancesBody,
} from "@/app/lib/types/enemyInstance";

type ApiErrorPayload = { message?: string; details?: string };

function getMessage(
  payload: ApiErrorPayload | undefined,
  status: number,
  fallback: string
) {
  return payload?.message ?? `${fallback} (${status})`;
}

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
