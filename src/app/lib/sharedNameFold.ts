import { normalizeOfficialName } from "@/app/lib/officialName";

/**
 * Official-name fold, then drop a possessive `'s` or `’s` that ends a word,
 * then drop remaining punctuation and collapse whitespace again.
 * Letters and numbers stay. An s after an apostrophe inside a word stays.
 */
export function foldSharedName(name: string): string {
  const withoutPossessive = normalizeOfficialName(name).replaceAll(
    /['’]s(?![\p{L}\p{N}])/gu,
    ""
  );
  return withoutPossessive
    .replaceAll(/\p{P}/gu, "")
    .replaceAll(/\s+/gu, " ")
    .trim();
}
