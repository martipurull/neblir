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

/** Base letter order, then code-unit order when that sort ties. */
function compareSharedSpellings(left: string, right: string): number {
  const byBase = left.localeCompare(right, undefined, { sensitivity: "base" });
  if (byBase !== 0) return byBase;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/** The spelling a later save keeps when several stored spellings share a fold. */
export function spellingThatSortsFirst(spellings: readonly string[]): string {
  return spellings.reduce((best, spelling) =>
    compareSharedSpellings(spelling, best) < 0 ? spelling : best
  );
}
