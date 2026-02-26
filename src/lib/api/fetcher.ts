type ApiErrorPayload = {
  message?: string;
  details?: string;
};

export async function apiFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let errorMessage = "Request failed";
    try {
      const errorPayload = (await response.json()) as ApiErrorPayload;
      errorMessage =
        errorPayload.details || errorPayload.message || errorMessage;
    } catch {
      // Keep fallback error message when response body is not JSON.
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}
