export type OfficialNamedRow = {
  id: string;
  name: string;
};

/** Unicode default case folding beyond `toLowerCase` (CaseFolding.txt full map for ß). */
function unicodeCaseFold(value: string): string {
  return value.toLowerCase().replaceAll("ß", "ss");
}

/** Trim, Unicode case-fold, and collapse internal whitespace. */
export function normalizeOfficialName(name: string): string {
  return unicodeCaseFold(name.trim().replace(/\s+/gu, " "));
}

export function officialNameConflicts(
  existing: ReadonlyArray<OfficialNamedRow>,
  candidate: string,
  excludeId?: string
): boolean {
  const normalized = normalizeOfficialName(candidate);
  const excludedId = excludeId?.trim();
  return existing.some(
    (row) =>
      row.id !== excludedId && normalizeOfficialName(row.name) === normalized
  );
}
