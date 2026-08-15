/** Given name + optional surname, matching character header display. */
export function formatCharacterDisplayName(
  name: string | null | undefined,
  surname?: string | null
): string {
  const first = name?.trim() ?? "";
  const last = surname?.trim() ?? "";
  return [first, last].filter((part) => part.length > 0).join(" ");
}

/** Use a fetched entity name when present; otherwise a generic fallback. */
export function resolveEntityPageTitle(
  name: string | null | undefined,
  fallback: string
): string {
  const trimmed = name?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : fallback;
}
