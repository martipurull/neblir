import { parse } from "csv-parse/sync";
import { z } from "zod";
import { enemyActionSchema } from "@/app/lib/types/enemy";
import { weaponDamageTypeSchema } from "@/app/lib/types/item";
import type { ItemWeaponDamageType } from "@prisma/client";

/** Column order for export and recommended import templates. */
const CUSTOM_ENEMY_CSV_COLUMNS = [
  "name",
  "description",
  "imageKey",
  "health",
  "speed",
  "initiativeModifier",
  "numberOfReactions",
  "defenceMelee",
  "defenceRange",
  "defenceGrid",
  "attackMelee",
  "attackRange",
  "attackThrow",
  "attackGrid",
  "immunities",
  "resistances",
  "vulnerabilities",
  "notes",
  /** JSON array of action objects; same shape as {@link enemyActionSchema}. Empty cell = []. */
  "actions",
  /** JSON array; same as `actions`. */
  "additionalActions",
] as const;

const intCell = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return 0;
  const n = Number.parseInt(String(v), 10);
  return Number.isNaN(n) ? 0 : n;
}, z.number().int());

function parsePipeDamageTypes(raw: unknown): ItemWeaponDamageType[] {
  if (raw === null || raw === undefined) return [];
  if (Array.isArray(raw)) {
    const out: ItemWeaponDamageType[] = [];
    for (const value of raw) {
      const parsed = weaponDamageTypeSchema.safeParse(value);
      if (parsed.success) out.push(parsed.data);
    }
    return out;
  }
  const s = String(raw).trim();
  if (!s) return [];
  const parts = s
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);
  const out: ItemWeaponDamageType[] = [];
  for (const p of parts) {
    const r = weaponDamageTypeSchema.safeParse(p);
    if (r.success) out.push(r.data);
  }
  return out;
}

function enemyActionsCsvCell(field: "actions" | "additionalActions") {
  return z
    .union([z.string(), z.array(z.unknown()), z.undefined(), z.null()])
    .transform((raw, ctx): z.infer<typeof enemyActionSchema>[] => {
      if (raw == null) return [];
      let parsed: unknown;
      if (Array.isArray(raw)) {
        parsed = raw;
      } else {
        const s = String(raw).trim();
        if (!s) return [];
        try {
          parsed = JSON.parse(s) as unknown;
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${field}: invalid JSON`,
          });
          return z.NEVER;
        }
      }
      if (!Array.isArray(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${field}: JSON root must be an array`,
        });
        return z.NEVER;
      }
      const out: z.infer<typeof enemyActionSchema>[] = [];
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (item === null || item === undefined) continue;
        const r = enemyActionSchema.safeParse(item);
        if (!r.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${field}[${i}]: ${r.error.issues.map((x) => x.message).join("; ")}`,
          });
          return z.NEVER;
        }
        out.push(r.data);
      }
      return out;
    });
}

const customEnemyCsvRowSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional(),
  imageKey: z.string().optional(),
  health: intCell,
  speed: intCell,
  initiativeModifier: intCell,
  numberOfReactions: intCell,
  defenceMelee: intCell,
  defenceRange: intCell,
  defenceGrid: intCell,
  attackMelee: intCell,
  attackRange: intCell,
  attackThrow: intCell,
  attackGrid: intCell,
  immunities: z.preprocess(
    parsePipeDamageTypes,
    z.array(weaponDamageTypeSchema)
  ),
  resistances: z.preprocess(
    parsePipeDamageTypes,
    z.array(weaponDamageTypeSchema)
  ),
  vulnerabilities: z.preprocess(
    parsePipeDamageTypes,
    z.array(weaponDamageTypeSchema)
  ),
  notes: z.string().optional(),
  actions: enemyActionsCsvCell("actions"),
  additionalActions: enemyActionsCsvCell("additionalActions"),
});

export type CustomEnemyCsvRow = z.infer<typeof customEnemyCsvRowSchema>;
export type CustomEnemyTransferRow = CustomEnemyCsvRow;

function normalizeMongoExtendedJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeMongoExtendedJson(item));
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 1) {
      if (typeof obj.$numberInt === "string")
        return Number.parseInt(obj.$numberInt, 10);
      if (typeof obj.$numberLong === "string")
        return Number.parseInt(obj.$numberLong, 10);
      if (typeof obj.$numberDouble === "string")
        return Number.parseFloat(obj.$numberDouble);
      if (typeof obj.$oid === "string") return obj.$oid;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = normalizeMongoExtendedJson(v);
    }
    return out;
  }
  return value;
}

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function damageTypesToCell(types: ItemWeaponDamageType[]): string {
  return types.join("|");
}

export function serializeCustomEnemyRowToCsvLine(row: {
  name: string;
  description?: string | null;
  imageKey?: string | null;
  health: number;
  speed: number;
  initiativeModifier: number;
  numberOfReactions: number;
  defenceMelee: number;
  defenceRange: number;
  defenceGrid: number;
  attackMelee: number;
  attackRange: number;
  attackThrow: number;
  attackGrid: number;
  immunities: ItemWeaponDamageType[];
  resistances: ItemWeaponDamageType[];
  vulnerabilities: ItemWeaponDamageType[];
  notes?: string | null;
  /** Prisma embedded actions use `null` for unset fields; `z.infer` uses `undefined`. */
  actions?: z.input<typeof enemyActionSchema>[];
  additionalActions?: z.input<typeof enemyActionSchema>[];
}): string {
  const actionsJson = JSON.stringify(row.actions ?? []);
  const additionalJson = JSON.stringify(row.additionalActions ?? []);
  const cells = [
    row.name,
    row.description ?? "",
    row.imageKey ?? "",
    String(row.health),
    String(row.speed),
    String(row.initiativeModifier),
    String(row.numberOfReactions),
    String(row.defenceMelee),
    String(row.defenceRange),
    String(row.defenceGrid),
    String(row.attackMelee),
    String(row.attackRange),
    String(row.attackThrow),
    String(row.attackGrid),
    damageTypesToCell(row.immunities),
    damageTypesToCell(row.resistances),
    damageTypesToCell(row.vulnerabilities),
    row.notes ?? "",
    actionsJson,
    additionalJson,
  ].map((c) => csvEscape(c));
  return cells.join(",");
}

export function customEnemyCsvHeaderLine(): string {
  return [...CUSTOM_ENEMY_CSV_COLUMNS].join(",");
}

export function parseCustomEnemyCsv(csvText: string): {
  rows: CustomEnemyCsvRow[];
  rowErrors: Array<{ line: number; message: string }>;
} {
  const trimmed = csvText.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    return { rows: [], rowErrors: [{ line: 0, message: "CSV is empty." }] };
  }

  let records: Record<string, string>[];
  try {
    records = parse(trimmed, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];
  } catch (e) {
    return {
      rows: [],
      rowErrors: [
        {
          line: 0,
          message: e instanceof Error ? e.message : "Failed to parse CSV.",
        },
      ],
    };
  }

  const rows: CustomEnemyCsvRow[] = [];
  const rowErrors: Array<{ line: number; message: string }> = [];

  records.forEach((rec, index) => {
    const line = index + 2;
    const normalized: Record<string, unknown> = {};
    for (const col of CUSTOM_ENEMY_CSV_COLUMNS) {
      const key = Object.keys(rec).find(
        (k) => k.trim().toLowerCase() === col.toLowerCase()
      );
      normalized[col] = key != null ? rec[key] : "";
    }
    const parsed = customEnemyCsvRowSchema.safeParse(normalized);
    if (!parsed.success) {
      rowErrors.push({
        line,
        message: parsed.error.issues.map((i) => i.message).join("; "),
      });
      return;
    }
    rows.push(parsed.data);
  });

  return { rows, rowErrors };
}

export function parseCustomEnemyJson(jsonText: string): {
  rows: CustomEnemyTransferRow[];
  rowErrors: Array<{ line: number; message: string }>;
} {
  const trimmed = jsonText.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    return { rows: [], rowErrors: [{ line: 0, message: "JSON is empty." }] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch (e) {
    return {
      rows: [],
      rowErrors: [
        {
          line: 0,
          message: e instanceof Error ? e.message : "Failed to parse JSON.",
        },
      ],
    };
  }

  let items: unknown[] = [];
  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as { enemies?: unknown[] }).enemies)
  ) {
    items = (parsed as { enemies: unknown[] }).enemies;
  } else {
    return {
      rows: [],
      rowErrors: [
        {
          line: 0,
          message:
            'JSON root must be an array or an object with "enemies" array.',
        },
      ],
    };
  }

  const rows: CustomEnemyTransferRow[] = [];
  const rowErrors: Array<{ line: number; message: string }> = [];

  items.forEach((item, index) => {
    const parsedRow = customEnemyCsvRowSchema.safeParse(
      normalizeMongoExtendedJson(item)
    );
    if (!parsedRow.success) {
      rowErrors.push({
        line: index + 1,
        message: parsedRow.error.issues.map((i) => i.message).join("; "),
      });
      return;
    }
    rows.push(parsedRow.data);
  });

  return { rows, rowErrors };
}

export function serializeCustomEnemyRowsToJson(
  rows: Array<{
    name: string;
    description?: string | null;
    imageKey?: string | null;
    health: number;
    speed: number;
    initiativeModifier: number;
    numberOfReactions: number;
    defenceMelee: number;
    defenceRange: number;
    defenceGrid: number;
    attackMelee: number;
    attackRange: number;
    attackThrow: number;
    attackGrid: number;
    immunities: ItemWeaponDamageType[];
    resistances: ItemWeaponDamageType[];
    vulnerabilities: ItemWeaponDamageType[];
    notes?: string | null;
    actions?: z.input<typeof enemyActionSchema>[];
    additionalActions?: z.input<typeof enemyActionSchema>[];
  }>
): string {
  return JSON.stringify(
    rows.map((row) => ({
      name: row.name,
      description: row.description ?? "",
      imageKey: row.imageKey ?? "",
      health: row.health,
      speed: row.speed,
      initiativeModifier: row.initiativeModifier,
      numberOfReactions: row.numberOfReactions,
      defenceMelee: row.defenceMelee,
      defenceRange: row.defenceRange,
      defenceGrid: row.defenceGrid,
      attackMelee: row.attackMelee,
      attackRange: row.attackRange,
      attackThrow: row.attackThrow,
      attackGrid: row.attackGrid,
      immunities: row.immunities,
      resistances: row.resistances,
      vulnerabilities: row.vulnerabilities,
      notes: row.notes ?? "",
      actions: row.actions ?? [],
      additionalActions: row.additionalActions ?? [],
    })),
    null,
    2
  );
}
