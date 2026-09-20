export type OfficialNamedRow = {
  id?: string | null;
  name?: string | null;
};

/** Trim, Unicode case-fold, and collapse internal whitespace. */
export function normalizeOfficialName(name: string): string {
  return name.trim().replace(/\s+/gu, " ").toLowerCase();
}

export function officialNameConflicts(
  existing: ReadonlyArray<OfficialNamedRow>,
  candidate: string,
  excludeId?: string
): boolean {
  const normalized = normalizeOfficialName(candidate);
  return existing.some(
    (row) =>
      Boolean(row.id) &&
      row.id !== excludeId &&
      typeof row.name === "string" &&
      normalizeOfficialName(row.name) === normalized
  );
}
