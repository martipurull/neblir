import {
  enemyListResponseSchema,
  enemyResponseSchema,
  type EnemyResponse,
} from "@/app/lib/types/enemy";
import { getUserSafeApiError } from "@/lib/userSafeError";

type ApiErrorPayload = { message?: string; details?: string };

export async function getEnemies(): Promise<EnemyResponse[]> {
  const response = await fetch("/api/enemies", { method: "GET" });
  if (!response.ok) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      body?.message ?? `Failed to fetch enemies (${response.status})`
    );
  }
  const json = await response.json();
  const parsed = enemyListResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Enemies response did not match expected shape");
  }
  return parsed.data;
}

export async function getEnemy(id: string): Promise<EnemyResponse> {
  const response = await fetch(`/api/enemies/${encodeURIComponent(id)}`, {
    method: "GET",
  });
  if (!response.ok) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      getUserSafeApiError(response.status, body, "Failed to fetch enemy")
    );
  }
  const parsed = enemyResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Enemy response did not match expected shape: ${details}`);
  }
  return parsed.data;
}

export async function addOfficialEnemyToGame(
  gameId: string,
  enemyId: string
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/custom-enemies/from-official`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enemyId }),
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
      body?.message ?? `Failed to add enemy (${response.status})`
    );
  }
}
