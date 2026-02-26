type ApiErrorPayload = {
  message?: string;
  details?: string;
};

export async function deleteCurrentUser(): Promise<void> {
  const response = await fetch("/api/users/me", {
    method: "DELETE",
  });

  if (!response.ok) {
    let errorMessage = "Failed to delete account";
    try {
      const errorPayload = (await response.json()) as ApiErrorPayload;
      errorMessage =
        errorPayload.details || errorPayload.message || errorMessage;
    } catch {
      // Keep fallback error when response body is not JSON.
    }
    throw new Error(errorMessage);
  }
}
