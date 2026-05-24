import { referenceEntryCreateSchema } from "../../src/app/lib/types/reference";

function deepNullsToUndefined(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => deepNullsToUndefined(item));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      const normalized = deepNullsToUndefined(v);
      if (normalized !== undefined) out[key] = normalized;
    }
    return out;
  }
  return value;
}

function stripSeedMeta(row: Record<string, unknown>): Record<string, unknown> {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    protectedFromOfficialImport: _protected,
    ...rest
  } = row;
  return rest;
}

export function parseReferenceSeedJson(raw: string): {
  id?: string;
  data: ReturnType<typeof referenceEntryCreateSchema.parse>;
}[] {
  const parsed = JSON.parse(raw) as unknown;
  const entries = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as { reference?: unknown[] }).reference)
      ? (parsed as { reference: unknown[] }).reference
      : null;
  if (!entries) {
    throw new Error(
      'JSON root must be an array or object with "reference" array.'
    );
  }

  const out: {
    id?: string;
    data: ReturnType<typeof referenceEntryCreateSchema.parse>;
  }[] = [];

  for (let i = 0; i < entries.length; i++) {
    const rawRow = entries[i];
    if (!rawRow || typeof rawRow !== "object") {
      throw new Error(`JSON reference ${i + 1}: expected an object.`);
    }
    const row = rawRow as Record<string, unknown>;
    const optionalId =
      typeof row.id === "string" && row.id.trim() ? row.id.trim() : undefined;
    const normalized = deepNullsToUndefined(stripSeedMeta(row));
    const result = referenceEntryCreateSchema.safeParse(normalized);
    if (!result.success) {
      throw new Error(
        `JSON reference ${i + 1}: ${result.error.issues.map((x) => x.message).join("; ")}`
      );
    }
    out.push({ id: optionalId, data: result.data });
  }

  return out;
}
