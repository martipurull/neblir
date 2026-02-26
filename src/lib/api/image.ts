type ApiErrorPayload = {
  message?: string;
  details?: string;
};

export async function getImageUrl(imageKey: string): Promise<string> {
  const response = await fetch(
    `/api/image-url?imageKey=${encodeURIComponent(imageKey)}`
  );

  if (!response.ok) {
    let errorMessage = "Failed to fetch image URL";
    try {
      const errorPayload = (await response.json()) as ApiErrorPayload;
      errorMessage =
        errorPayload.details || errorPayload.message || errorMessage;
    } catch {
      // Keep fallback error when response body is not JSON.
    }
    throw new Error(errorMessage);
  }

  const payload = (await response.json()) as { url?: string };
  if (!payload.url) {
    throw new Error("Image URL response did not include a url field");
  }

  return payload.url;
}
