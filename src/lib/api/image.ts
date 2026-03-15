import { getUserSafeApiError } from "@/lib/userSafeError";

type ApiErrorPayload = { message?: string; details?: string };

export async function getImageUrl(imageKey: string): Promise<string> {
  const response = await fetch(
    `/api/image-url?imageKey=${encodeURIComponent(imageKey)}`
  );

  if (!response.ok) {
    let body: ApiErrorPayload | undefined;
    try {
      body = (await response.json()) as ApiErrorPayload;
    } catch {
      // ignore
    }
    throw new Error(
      getUserSafeApiError(response.status, body, "Failed to fetch image URL")
    );
  }

  const payload = (await response.json()) as { url?: string };
  if (!payload.url) {
    throw new Error("Image URL response did not include a url field");
  }

  return payload.url;
}
