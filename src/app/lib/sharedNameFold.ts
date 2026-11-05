import { normalizeOfficialName } from "@/app/lib/officialName";

/**
 * Official-name fold, then drop a possessive `'s` or `’s`, then drop
 * remaining punctuation and collapse whitespace again. Letters and numbers stay.
 */
export function foldSharedName(name: string): string {
  const withoutPossessive = normalizeOfficialName(name).replaceAll(
    /['’]s/gu,
    ""
  );
  return withoutPossessive
    .replaceAll(/\p{P}/gu, "")
    .replaceAll(/\s+/gu, " ")
    .trim();
}
