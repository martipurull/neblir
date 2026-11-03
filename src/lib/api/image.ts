import { imageUrlResponseSchema } from "@/app/lib/types/image";
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

  const json: unknown = await response.json();
  const parsed = imageUrlResponseSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Image URL response did not match expected shape: ${details}`
    );
  }

  return parsed.data.url;
}
