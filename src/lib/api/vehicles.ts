import { z } from "zod";
import {
  resolvedVehicleSchema,
  vehicleCharacterSchema,
  type ActiveVehiclePatch,
  type AddVehicleToCharacter,
  type ResolvedVehicle,
  type VehicleCharacter,
  type VehicleCharacterPatch,
  type VehicleTransfer,
} from "@/app/lib/types/vehicle";
import { getUserSafeApiError } from "@/lib/userSafeError";

type ApiErrorPayload = { message?: string; details?: string };

const resolvedVehicleListSchema = z.array(resolvedVehicleSchema);

async function getErrorPayload(
  response: Response
): Promise<ApiErrorPayload | undefined> {
  try {
    return (await response.json()) as ApiErrorPayload;
  } catch {
    return undefined;
  }
}

export async function getOfficialVehicles(
  signal?: AbortSignal
): Promise<ResolvedVehicle[]> {
  const response = await fetch("/api/vehicles", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await getErrorPayload(response),
        "Failed to load vehicles"
      )
    );
  }

  const json = await response.json();
  const parsed = resolvedVehicleListSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Vehicle list response did not match expected shape: ${details}`
    );
  }

  return parsed.data;
}

export async function addVehicleToCharacter(
  characterId: string,
  body: AddVehicleToCharacter
): Promise<VehicleCharacter> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/vehicles`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await getErrorPayload(response),
        "Failed to add vehicle"
      )
    );
  }

  const json = await response.json();
  const parsed = vehicleCharacterSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Add vehicle response did not match expected shape: ${details}`
    );
  }

  return parsed.data;
}

export async function updateCharacterVehicleEntry(
  characterId: string,
  vehicleCharacterId: string,
  body: VehicleCharacterPatch
): Promise<VehicleCharacter> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/vehicles/${encodeURIComponent(vehicleCharacterId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await getErrorPayload(response),
        "Failed to update vehicle"
      )
    );
  }

  const json = await response.json();
  const parsed = vehicleCharacterSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Vehicle update response did not match expected shape: ${details}`
    );
  }

  return parsed.data;
}

export async function deleteCharacterVehicleEntry(
  characterId: string,
  vehicleCharacterId: string
): Promise<void> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/vehicles/${encodeURIComponent(vehicleCharacterId)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await getErrorPayload(response),
        "Failed to remove vehicle"
      )
    );
  }
}

export async function transferCharacterVehicle(
  characterId: string,
  vehicleCharacterId: string,
  body: VehicleTransfer
): Promise<void> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/vehicles/${encodeURIComponent(vehicleCharacterId)}/transfer`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await getErrorPayload(response),
        "Failed to transfer vehicle"
      )
    );
  }
}

export async function updateCharacterActiveVehicle(
  characterId: string,
  body: ActiveVehiclePatch
): Promise<void> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/active-vehicle`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await getErrorPayload(response),
        body.action === "mount"
          ? "Failed to mount vehicle"
          : "Failed to dismount vehicle"
      )
    );
  }
}

export async function attachCharacterVehicleMountedItem(
  characterId: string,
  vehicleCharacterId: string,
  body: { itemCharacterId: string; mountSlot?: string | null }
): Promise<VehicleCharacter> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/vehicles/${encodeURIComponent(vehicleCharacterId)}/mounted-items`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await getErrorPayload(response),
        "Failed to mount item on vehicle"
      )
    );
  }

  const json = (await response.json()) as { vehicle?: unknown };
  const parsed = vehicleCharacterSchema.safeParse(json.vehicle);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Mount item response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}

export async function detachCharacterVehicleMountedItem(
  characterId: string,
  vehicleCharacterId: string,
  mountedItemId: string
): Promise<VehicleCharacter | null> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/vehicles/${encodeURIComponent(vehicleCharacterId)}/mounted-items/${encodeURIComponent(mountedItemId)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await getErrorPayload(response),
        "Failed to detach mounted item"
      )
    );
  }

  const json = (await response.json()) as { vehicle?: unknown };
  if (json.vehicle == null) return null;
  const parsed = vehicleCharacterSchema.safeParse(json.vehicle);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Detach item response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}

async function parseVehicleFromEnvelope(
  response: Response,
  fallbackMessage: string
): Promise<VehicleCharacter> {
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await getErrorPayload(response),
        fallbackMessage
      )
    );
  }
  const json = (await response.json()) as { vehicle?: unknown };
  const parsed = vehicleCharacterSchema.safeParse(json.vehicle);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Vehicle response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}

export async function stowCharacterVehicleCargo(
  characterId: string,
  vehicleCharacterId: string,
  body: { itemCharacterId: string }
): Promise<VehicleCharacter> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/vehicles/${encodeURIComponent(vehicleCharacterId)}/cargo`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return parseVehicleFromEnvelope(response, "Failed to stow cargo");
}

export async function retrieveCharacterVehicleCargo(
  characterId: string,
  vehicleCharacterId: string,
  itemCharacterId: string
): Promise<VehicleCharacter> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/vehicles/${encodeURIComponent(vehicleCharacterId)}/cargo/${encodeURIComponent(itemCharacterId)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }
  );
  return parseVehicleFromEnvelope(response, "Failed to retrieve cargo");
}

export async function addCharacterVehiclePassenger(
  characterId: string,
  vehicleCharacterId: string,
  body: { passengerCharacterId: string }
): Promise<VehicleCharacter> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/vehicles/${encodeURIComponent(vehicleCharacterId)}/passengers`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  return parseVehicleFromEnvelope(response, "Failed to add passenger");
}

export async function removeCharacterVehiclePassenger(
  characterId: string,
  vehicleCharacterId: string,
  passengerCharacterId: string
): Promise<VehicleCharacter> {
  const response = await fetch(
    `/api/characters/${encodeURIComponent(characterId)}/vehicles/${encodeURIComponent(vehicleCharacterId)}/passengers/${encodeURIComponent(passengerCharacterId)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    }
  );
  return parseVehicleFromEnvelope(response, "Failed to remove passenger");
}
