/**
 * `undefined` = still loading a real key; `null` = no image / failed load.
 * Missing keys must never look like a pending fetch.
 */
export function resolveRemoteImageUrl(
  imageKey: string | null | undefined,
  imageUrl: string | null | undefined
): string | null | undefined {
  if (!imageKey) return null;
  return imageUrl;
}
