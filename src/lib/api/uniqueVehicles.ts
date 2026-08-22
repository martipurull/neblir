import {
  uniqueVehicleDetailResponseSchema,
  uniqueVehicleListResponseSchema,
  type UniqueVehicleCreate,
  type UniqueVehicleDetailResponse,
  type UniqueVehicleListItem,
  type UniqueVehicleUpdate,
} from "@/app/lib/types/vehicle";
import { getUserSafeApiError } from "@/lib/userSafeError";

type ApiErrorPayload = { message?: string; details?: string };

export async function getGameUniqueVehicles(
  gameId: string,
  signal?: AbortSignal
): Promise<UniqueVehicleListItem[]> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/unique-vehicles`,
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
      getUserSafeApiError(
        response.status,
        body,
        "Failed to load unique vehicles"
      )
    );
  }

  const json = await response.json();
  const parsed = uniqueVehicleListResponseSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Unique vehicles response did not match expected shape: ${details}`
    );
  }

  return parsed.data;
}

export async function getUniqueVehicleById(
  uniqueVehicleId: string,
  signal?: AbortSignal
): Promise<UniqueVehicleDetailResponse> {
  const response = await fetch(
    `/api/unique-vehicles/${encodeURIComponent(uniqueVehicleId)}`,
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
      getUserSafeApiError(
        response.status,
        body,
        "Failed to load unique vehicle"
      )
    );
  }

  const json = await response.json();
  const parsed = uniqueVehicleDetailResponseSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Unique vehicle response did not match expected shape: ${details}`
    );
  }

  return parsed.data;
}

export async function createUniqueVehicle(
  body: UniqueVehicleCreate
): Promise<{ id: string }> {
  const response = await fetch("/api/unique-vehicles", {
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
        "Failed to create unique vehicle"
      )
    );
  }

  const json = (await response.json()) as { id?: string };
  if (!json.id) {
    throw new Error("Unique vehicle create response did not include an id");
  }
  return { id: json.id };
}

export async function updateUniqueVehicle(
  uniqueVehicleId: string,
  body: UniqueVehicleUpdate
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `/api/unique-vehicles/${encodeURIComponent(uniqueVehicleId)}`,
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
        "Failed to update unique vehicle"
      )
    );
  }

  return (await response.json()) as Record<string, unknown>;
}
