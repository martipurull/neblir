import type { CharacterSectionOrder } from "@/app/lib/constants/characterSections";
import type { CharacterLayoutMode } from "@/app/lib/types/user";
import { getUserSafeApiError } from "@/lib/userSafeError";

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

export async function updateUserCharacterCarouselWrap(
  userId: string,
  wrapAtEdges: boolean | null
): Promise<void> {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ characterCarouselWrap: wrapAtEdges }),
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
        "Failed to update carousel wrap preference"
      )
    );
  }
}

export async function updateUserCharacterSectionOrder(
  userId: string,
  order: CharacterSectionOrder | null
): Promise<void> {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ characterSectionOrder: order }),
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
        "Failed to update character section order"
      )
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
