import {
  gameRecapDownloadSchema,
  gameRecapListSchema,
  gameRecapSchema,
  recapUploadUrlResponseSchema,
  type GameRecap,
  type GameRecapCreate,
  type RecapUploadUrlRequest,
} from "@/app/lib/types/recap";
import { getUserSafeApiError } from "@/lib/userSafeError";

type ApiErrorPayload = { message?: string; details?: string };

async function readErrorBody(
  response: Response
): Promise<ApiErrorPayload | undefined> {
  try {
    return (await response.json()) as ApiErrorPayload;
  } catch {
    return undefined;
  }
}

export async function getGameRecaps(gameId: string): Promise<GameRecap[]> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/recaps`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to fetch recaps"
      )
    );
  }
  return gameRecapListSchema.parse(await response.json());
}

export async function createGameRecap(
  gameId: string,
  body: GameRecapCreate
): Promise<GameRecap> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/recaps`,
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
        await readErrorBody(response),
        "Failed to create recap"
      )
    );
  }
  return gameRecapSchema.parse(await response.json());
}

export async function requestRecapUploadUrl(
  body: RecapUploadUrlRequest
): Promise<{ fileKey: string; uploadUrl: string }> {
  const response = await fetch("/api/recap-upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to prepare recap upload"
      )
    );
  }
  return recapUploadUrlResponseSchema.parse(await response.json());
}

export async function uploadRecapPdfToStorage(
  uploadUrl: string,
  file: File
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": "application/pdf",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to upload recap PDF to storage.");
  }
}

export async function deleteUploadedRecapFile(fileKey: string): Promise<void> {
  await fetch(`/api/upload-file?fileKey=${encodeURIComponent(fileKey)}`, {
    method: "DELETE",
  });
}

export async function deleteGameRecap(
  gameId: string,
  recapId: string
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/recaps/${encodeURIComponent(recapId)}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to delete recap"
      )
    );
  }
}

export async function getRecapDownloadUrl(recapId: string): Promise<string> {
  const response = await fetch(
    `/api/recap-url?recapId=${encodeURIComponent(recapId)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to get recap download URL"
      )
    );
  }
  const parsed = gameRecapDownloadSchema.parse(await response.json());
  return parsed.url;
}
