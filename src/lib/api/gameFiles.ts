import {
  gameFileDownloadSchema,
  gameFileListSchema,
  gameFileSchema,
  gameFileUploadUrlResponseSchema,
  type GameFile,
  type GameFileCreate,
  type GameFileUpdate,
  type GameFileUploadUrlRequest,
} from "@/app/lib/types/gameFile";
import { contentTypeFromFileName } from "@/app/lib/r2UploadKeys";
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

export async function getGameFiles(gameId: string): Promise<GameFile[]> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/files`,
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
        "Failed to fetch files"
      )
    );
  }
  return gameFileListSchema.parse(await response.json());
}

export async function createGameFile(
  gameId: string,
  body: GameFileCreate
): Promise<GameFile> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/files`,
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
        "Failed to create file"
      )
    );
  }
  return gameFileSchema.parse(await response.json());
}

export async function updateGameFile(
  gameId: string,
  fileId: string,
  body: GameFileUpdate
): Promise<GameFile> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/files/${encodeURIComponent(fileId)}`,
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
        await readErrorBody(response),
        "Failed to update file"
      )
    );
  }
  return gameFileSchema.parse(await response.json());
}

export async function requestGameFileUploadUrl(
  body: GameFileUploadUrlRequest
): Promise<{
  fileKey: string;
  uploadUrl: string;
  thumbnailFileKey?: string;
  thumbnailUploadUrl?: string;
}> {
  const response = await fetch("/api/game-file-upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to prepare file upload"
      )
    );
  }
  return gameFileUploadUrlResponseSchema.parse(await response.json());
}

export async function uploadGameFileToStorage(
  uploadUrl: string,
  file: File
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || contentTypeFromFileName(file.name),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to upload file to storage.");
  }
}

export async function deleteUploadedGameFile(fileKey: string): Promise<void> {
  await fetch(`/api/upload-file?fileKey=${encodeURIComponent(fileKey)}`, {
    method: "DELETE",
  });
}

export async function deleteGameFile(
  gameId: string,
  fileId: string
): Promise<void> {
  const response = await fetch(
    `/api/games/${encodeURIComponent(gameId)}/files/${encodeURIComponent(fileId)}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to delete file"
      )
    );
  }
}

export async function getGameFileDownload(
  fileId: string,
  disposition: "inline" | "attachment" = "inline"
): Promise<{ url: string; thumbnailUrl?: string }> {
  const params = new URLSearchParams({
    fileId,
    disposition,
  });
  const response = await fetch(`/api/game-file-url?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to get file URL"
      )
    );
  }
  return gameFileDownloadSchema.parse(await response.json());
}

export async function getGameFileUrl(
  fileId: string,
  disposition: "inline" | "attachment" = "inline"
): Promise<string> {
  return (await getGameFileDownload(fileId, disposition)).url;
}
