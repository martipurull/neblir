import { getUserSafeApiError } from "@/lib/userSafeError";
import type { CharacterLayoutMode } from "@/app/lib/types/user";

type ApiErrorPayload = { message?: string; details?: string };

export async function deleteCurrentUser(): Promise<void> {
  const response = await fetch("/api/users/me", {
    method: "DELETE",
  });

  if (!response.ok) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      getUserSafeApiError(response.status, body, "Failed to delete account")
    );
  }
}

export async function updateUserCharacterLayoutMode(
  userId: string,
  mode: CharacterLayoutMode | null
): Promise<void> {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ characterLayoutMode: mode }),
  });

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
        "Failed to update character layout preference"
      )
    );
  }
}
