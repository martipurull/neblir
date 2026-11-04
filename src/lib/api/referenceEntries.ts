import {
  referenceEntryListSchema,
  referenceEntrySchema,
  type ReferenceCategory,
  type ReferenceEntry,
  type ReferenceEntryCreate,
  type ReferenceEntryUpdate,
} from "@/app/lib/types/reference";
import { responseShapeError } from "@/lib/api/responseShape";
import { getUserSafeApiError } from "@/lib/userSafeError";

type ApiErrorPayload = { message?: string; details?: string };

function parseApiError(
  status: number,
  body: ApiErrorPayload | undefined,
  fallback: string
) {
  return getUserSafeApiError(status, body, fallback);
}

async function readErrorBody(
  response: Response
): Promise<ApiErrorPayload | undefined> {
  try {
    return (await response.json()) as ApiErrorPayload;
  } catch {
    return undefined;
  }
}

export type ReferenceEntryListParams = {
  category?: ReferenceCategory;
  gameId?: string;
  scope?: "official";
};

export async function getReferenceEntries(
  params: ReferenceEntryListParams = {},
  signal?: AbortSignal
): Promise<ReferenceEntry[]> {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set("category", params.category);
  if (params.gameId) searchParams.set("gameId", params.gameId);
  if (params.scope) searchParams.set("scope", params.scope);

  const query = searchParams.toString();
  const response = await fetch(
    `/api/reference-entries${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(
      parseApiError(
        response.status,
        await readErrorBody(response),
        "Failed to fetch reference entries"
      )
    );
  }

  const parsed = referenceEntryListSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Reference entries", parsed.error);
  }

  return parsed.data;
}

export async function getReferenceEntry(
  id: string,
  signal?: AbortSignal
): Promise<ReferenceEntry> {
  const response = await fetch(
    `/api/reference-entries/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(
      parseApiError(
        response.status,
        await readErrorBody(response),
        "Failed to fetch reference entry"
      )
    );
  }

  const parsed = referenceEntrySchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("Reference entry response did not match expected shape");
  }

  return parsed.data;
}

export async function getCatalogueReferenceEntry(
  id: string,
  signal?: AbortSignal
): Promise<ReferenceEntry> {
  const response = await fetch(
    `/api/reference-entries/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(
      parseApiError(
        response.status,
        await readErrorBody(response),
        "Failed to fetch reference entry"
      )
    );
  }

  const parsed = referenceEntrySchema.safeParse(await response.json());
  if (!parsed.success) {
    throw responseShapeError("Reference entry", parsed.error);
  }

  return parsed.data;
}

export async function createReferenceEntry(
  body: ReferenceEntryCreate
): Promise<ReferenceEntry> {
  const response = await fetch("/api/reference-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      parseApiError(
        response.status,
        await readErrorBody(response),
        "Failed to create reference entry"
      )
    );
  }

  return referenceEntrySchema.parse(await response.json());
}

export async function updateReferenceEntry(
  id: string,
  body: ReferenceEntryUpdate
): Promise<ReferenceEntry> {
  const response = await fetch(
    `/api/reference-entries/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(
      parseApiError(
        response.status,
        await readErrorBody(response),
        "Failed to update reference entry"
      )
    );
  }

  return referenceEntrySchema.parse(await response.json());
}

export async function deleteReferenceEntry(id: string): Promise<void> {
  const response = await fetch(
    `/api/reference-entries/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error(
      parseApiError(
        response.status,
        await readErrorBody(response),
        "Failed to delete reference entry"
      )
    );
  }
}
