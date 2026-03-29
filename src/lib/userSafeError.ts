const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

const MAX_SAFE_MESSAGE_LENGTH = 200;

/**
 * Heuristic: message is likely a serialized error or stack trace, not user-facing.
 */
function looksLikeSerializedError(text: string): boolean {
  if (text.length > MAX_SAFE_MESSAGE_LENGTH) return true;
  const t = text.trim();
  if (t.startsWith("{") && (t.includes('"stack"') || t.includes('"message"')))
    return true;
  if (t.includes("\n    at ") || t.includes(".ts:") || t.includes(".js:"))
    return true;
  return false;
}

/**
 * Returns a user-safe message for API error responses.
 * For 5xx we never show details. For 4xx we show body.message only if short and safe.
 */
export function getUserSafeApiError(
  status: number,
  body: { message?: string; details?: string } | undefined,
  fallback: string = DEFAULT_MESSAGE
): string {
  if (status >= 500) return fallback;
  const message = body?.message ?? body?.details ?? "";
  if (typeof message !== "string" || !message.trim()) return fallback;
  const trimmed = message.trim();
  if (looksLikeSerializedError(trimmed)) return fallback;
  return trimmed.length > MAX_SAFE_MESSAGE_LENGTH
    ? trimmed.slice(0, MAX_SAFE_MESSAGE_LENGTH) + "…"
    : trimmed;
}

/**
 * Returns a user-safe message for thrown errors or unknown catch values.
 * Avoids showing stack traces, serialized errors, or very long technical messages.
 */
export function getUserSafeErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_MESSAGE
): string {
  if (error == null) return fallback;
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : String(error);
  if (!message || typeof message !== "string") return fallback;
  const trimmed = message.trim();
  if (looksLikeSerializedError(trimmed)) return fallback;
  return trimmed.length > MAX_SAFE_MESSAGE_LENGTH
    ? trimmed.slice(0, MAX_SAFE_MESSAGE_LENGTH) + "…"
    : trimmed;
}
