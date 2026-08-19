import {
  loreAttachmentDownloadSchema,
  loreAttachmentUploadUrlResponseSchema,
  referenceEntryAttachmentListSchema,
  referenceEntryAttachmentSchema,
  type LoreAttachmentUploadUrlRequest,
  type ReferenceEntryAttachment,
  type ReferenceEntryAttachmentCreate,
} from "@/app/lib/types/referenceEntryAttachment";
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

export async function getReferenceEntryAttachments(
  entryId: string
): Promise<ReferenceEntryAttachment[]> {
  const response = await fetch(
    `/api/reference-entries/${encodeURIComponent(entryId)}/attachments`,
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
        "Failed to fetch attachments"
      )
    );
  }
  return referenceEntryAttachmentListSchema.parse(await response.json());
}

export async function createReferenceEntryAttachment(
  entryId: string,
  body: ReferenceEntryAttachmentCreate
): Promise<ReferenceEntryAttachment> {
  const response = await fetch(
    `/api/reference-entries/${encodeURIComponent(entryId)}/attachments`,
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
        "Failed to add attachment"
      )
    );
  }
  return referenceEntryAttachmentSchema.parse(await response.json());
}

export async function deleteReferenceEntryAttachment(
  entryId: string,
  attachmentId: string
): Promise<void> {
  const response = await fetch(
    `/api/reference-entries/${encodeURIComponent(entryId)}/attachments/${encodeURIComponent(attachmentId)}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to delete attachment"
      )
    );
  }
}

export async function requestLoreAttachmentUploadUrl(
  body: LoreAttachmentUploadUrlRequest
): Promise<{ fileKey: string; uploadUrl: string }> {
  const response = await fetch("/api/lore-attachment-upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(
      getUserSafeApiError(
        response.status,
        await readErrorBody(response),
        "Failed to prepare attachment upload"
      )
    );
  }
  return loreAttachmentUploadUrlResponseSchema.parse(await response.json());
}

export async function uploadLoreFileToStorage(
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
    throw new Error("Failed to upload lore attachment to storage.");
  }
}

export async function deleteUploadedLoreFile(fileKey: string): Promise<void> {
  await fetch(`/api/upload-file?fileKey=${encodeURIComponent(fileKey)}`, {
    method: "DELETE",
  });
}

export async function getLoreAttachmentUrl(
  attachmentId: string,
  disposition: "inline" | "attachment" = "inline"
): Promise<string> {
  const params = new URLSearchParams({
    attachmentId,
    disposition,
  });
  const response = await fetch(
    `/api/lore-attachment-url?${params.toString()}`,
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
        "Failed to get attachment download URL"
      )
    );
  }
  const parsed = loreAttachmentDownloadSchema.parse(await response.json());
  return parsed.url;
}
