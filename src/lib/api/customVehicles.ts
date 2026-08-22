import {
  customVehicleListResponseSchema,
  customVehicleResponseSchema,
  type CustomVehicleResponse,
  type CustomVehicleUpdate,
} from "@/app/lib/types/vehicle";
import { getUserSafeApiError } from "@/lib/userSafeError";

type ApiErrorPayload = { message?: string; details?: string };

export async function getGameCustomVehicleRecord(
  gameId: string,
  vehicleId: string,
  signal?: AbortSignal
): Promise<CustomVehicleResponse> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/custom-vehicles/${encodeURIComponent(vehicleId)}`,
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
        "Failed to load custom vehicle"
      )
    );
  }

  const json = await response.json();
  const parsed = customVehicleResponseSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Custom vehicle response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}

export async function updateGameCustomVehicle(
  gameId: string,
  vehicleId: string,
  body: CustomVehicleUpdate
): Promise<CustomVehicleResponse> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/custom-vehicles/${encodeURIComponent(vehicleId)}`,
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
        "Failed to update custom vehicle"
      )
    );
  }

  const json = await response.json();
  const parsed = customVehicleResponseSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Custom vehicle response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}

export async function fetchGameCustomVehicles(
  gameId: string,
  signal?: AbortSignal
): Promise<CustomVehicleResponse[]> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/custom-vehicles`,
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
        "Failed to load custom vehicles"
      )
    );
  }
  const json = await response.json();
  const parsed = customVehicleListResponseSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Custom vehicles response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}
