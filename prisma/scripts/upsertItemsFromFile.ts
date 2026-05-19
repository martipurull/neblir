/**
 * Upsert global Item documents from CSV or JSON.
 *
 * - **Full row**: `type` is GENERAL_ITEM or WEAPON; all columns match the upload script.
 *   Optional `id` / `_id` column: update by that id when present in the DB; if the id is
 *   missing (e.g. seed from another environment), fall back to normalized name match before
 *   insert. Without id, match by normalized name only.
 * - **Patch row**: omit `type` (or leave empty). Row must include `id`/`_id` or `name`;
 *   only `modifiesAttribute`, `attributeMod`, `modifiesSkill`, `skillMod` are applied
 *   when those columns are non-empty (others unchanged).
 *
 * Usage: npx tsx prisma/scripts/upsertItemsFromFile.ts <path-to-items.csv|json>
 *
 * Env: MONGODB_URI (required).
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import {
  mapApiModifiersToPrismaFields,
  mapParsedItemToPrismaCreate,
} from "../../src/app/lib/itemModifierPrisma";
import {
  itemAttributePathSchema,
  itemGeneralSkillSchema,
} from "../../src/app/lib/itemModifierEnums";
import { itemSchema } from "../../src/app/lib/types/item";
import {
  csvRowDeclaresFullItem,
  csvRowOptionalId,
  csvRowToItem,
  csvRowToItemModifierPatch,
  normalizeItemNameKey,
} from "./uploadItemsFromCSV";
import { parseOfficialImportArgv } from "./officialImportCli";

const prisma = new PrismaClient();

function itemImportWouldOverwriteProtectedRow(
  existing: { protectedFromOfficialImport: boolean } | null,
  forceOfficialImport: boolean
): boolean {
  return Boolean(existing?.protectedFromOfficialImport && !forceOfficialImport);
}

type ExistingItemRow = {
  id: string;
  name: string;
  protectedFromOfficialImport: boolean;
};

async function findExistingItemByName(
  name: string
): Promise<ExistingItemRow | null> {
  const nameKey = normalizeItemNameKey(name);
  const candidates = await prisma.item.findMany({
    where: { name: name.trim() },
    select: {
      id: true,
      name: true,
      protectedFromOfficialImport: true,
    },
  });
  return (
    candidates.find((c) => normalizeItemNameKey(c.name) === nameKey) ?? null
  );
}

/** Resolve an existing row by id, else by normalized name (cross-env seed safe). */
async function resolveExistingItemForFullUpsert(
  idFromRow: string | undefined,
  itemName: string
): Promise<ExistingItemRow | null> {
  if (idFromRow?.trim()) {
    const byId = await prisma.item.findUnique({
      where: { id: idFromRow.trim() },
      select: {
        id: true,
        name: true,
        protectedFromOfficialImport: true,
      },
    });
    if (byId) return byId;
  }
  return findExistingItemByName(itemName);
}

async function upsertFullItemFromRow(options: {
  idFromRow: string | undefined;
  itemPayload: Omit<FullItemRow, "id">;
  createData: ReturnType<typeof mapParsedItemToPrismaCreate>;
  forceOfficialImport: boolean;
}): Promise<"created" | "updated" | "skippedProtected"> {
  const existing = await resolveExistingItemForFullUpsert(
    options.idFromRow,
    options.itemPayload.name
  );
  if (existing) {
    if (
      itemImportWouldOverwriteProtectedRow(
        existing,
        options.forceOfficialImport
      )
    ) {
      return "skippedProtected";
    }
    await prisma.item.update({
      where: { id: existing.id },
      data: { ...options.createData },
    });
    return "updated";
  }
  if (options.idFromRow?.trim()) {
    await prisma.item.create({
      data: { ...options.createData, id: options.idFromRow.trim() },
    });
  } else {
    await prisma.item.create({ data: options.createData });
  }
  return "created";
}

const itemRowWithOptionalIdSchema = itemSchema.and(
  z.object({ id: z.string().optional() })
);

const patchRowSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    modifiesAttribute: itemAttributePathSchema.nullish(),
    attributeMod: z.number().int().nullish(),
    modifiesSkill: itemGeneralSkillSchema.nullish(),
    skillMod: z.number().int().nullish(),
  })
  .refine((r) => Boolean(r.id?.trim()) || Boolean(r.name?.trim()), {
    message: "Patch row needs id or name",
  });

type FullItemRow = z.infer<typeof itemRowWithOptionalIdSchema>;

function deepNullsToUndefined(value: unknown): unknown {
  if (value === null) return undefined;
  if (Array.isArray(value))
    return value.map((item) => deepNullsToUndefined(item));
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

function parseJsonRows(raw: string): FullItemRow[] {
  const parsed = JSON.parse(raw) as unknown;
  const entries = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as { items?: unknown[] }).items)
      ? (parsed as { items: unknown[] }).items
      : null;
  if (!entries) {
    throw new Error('JSON root must be an array or object with "items" array.');
  }
  const out: FullItemRow[] = [];
  for (let i = 0; i < entries.length; i++) {
    const full = itemRowWithOptionalIdSchema.safeParse(
      deepNullsToUndefined(entries[i])
    );
    if (!full.success) {
      throw new Error(
        `JSON item ${i + 1}: ${full.error.issues.map((x) => x.message).join("; ")}`
      );
    }
    out.push(full.data);
  }
  return out;
}

async function main() {
  const { dryRun, forceOfficialImport, positional } = parseOfficialImportArgv(
    process.argv.slice(2)
  );
  const csvPath = positional[0];
  if (!csvPath) {
    console.error(
      "Usage: npx tsx prisma/scripts/upsertItemsFromFile.ts <path-to-items.csv|json> [--dry-run] [--force-official-import]"
    );
    process.exit(1);
  }

  const resolvedPath = path.resolve(csvPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  let fullUpserts = 0;
  let patches = 0;
  let skippedProtectedFull = 0;
  let skippedProtectedPatch = 0;
  const ext = path.extname(resolvedPath).toLowerCase();
  if (ext === ".json") {
    const fullRows = parseJsonRows(fs.readFileSync(resolvedPath, "utf8"));
    if (dryRun) {
      console.log(`[dry-run] JSON items parsed: ${fullRows.length}.`);
      return;
    }
    for (const fullItem of fullRows) {
      const { id: idFromRow, ...itemPayload } = fullItem;
      const createData = mapParsedItemToPrismaCreate(itemPayload);
      const result = await upsertFullItemFromRow({
        idFromRow,
        itemPayload,
        createData,
        forceOfficialImport,
      });
      if (result === "skippedProtected") {
        const label = idFromRow?.trim()
          ? `id "${idFromRow.trim()}"`
          : `"${itemPayload.name}"`;
        console.warn(
          `[skip] Item ${label} is protected from official import (use --force-official-import to overwrite).`
        );
        skippedProtectedFull += 1;
        continue;
      }
      fullUpserts++;
    }
    console.log(
      `Done. JSON full upserts: ${fullUpserts}, skippedProtectedFull: ${skippedProtectedFull}, modifier patches: 0, items: ${fullRows.length}.`
    );
    return;
  }

  const raw = fs.readFileSync(resolvedPath).toString();
  const rows: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });
  if (rows.length === 0) {
    console.log("CSV has no data rows. Nothing to do.");
    return;
  }
  if (dryRun) {
    console.log(`[dry-run] CSV rows parsed: ${rows.length}.`);
    return;
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 2;

    if (csvRowDeclaresFullItem(row)) {
      let item;
      try {
        item = csvRowToItem(row);
      } catch (e) {
        console.error(`Row ${rowIndex}: CSV parse error`, e);
        process.exit(1);
      }

      const optionalId = csvRowOptionalId(row);
      const full = itemRowWithOptionalIdSchema.safeParse({
        ...item,
        id: optionalId,
      });
      if (!full.success) {
        console.error(`Row ${rowIndex}: full item validation failed`);
        console.error(full.error.flatten());
        process.exit(1);
      }

      const { id: idFromRow, ...itemPayload } = full.data;
      const createData = mapParsedItemToPrismaCreate(itemPayload);
      const result = await upsertFullItemFromRow({
        idFromRow,
        itemPayload,
        createData,
        forceOfficialImport,
      });
      if (result === "skippedProtected") {
        const label = idFromRow?.trim()
          ? `id "${idFromRow.trim()}"`
          : `"${itemPayload.name}"`;
        console.warn(
          `[skip] Item ${label} is protected from official import (use --force-official-import to overwrite).`
        );
        skippedProtectedFull += 1;
        continue;
      }
      fullUpserts++;
      continue;
    }

    let patchRaw;
    try {
      patchRaw = csvRowToItemModifierPatch(row);
    } catch (e) {
      console.error(`Row ${rowIndex}: patch CSV parse error`, e);
      process.exit(1);
    }

    const patchParsed = patchRowSchema.safeParse(patchRaw);
    if (!patchParsed.success) {
      console.error(
        `Row ${rowIndex}: not a full item (missing/invalid type) and not a valid patch row`
      );
      console.error(patchParsed.error.flatten());
      process.exit(1);
    }

    const p = patchParsed.data;
    const id = p.id?.trim();
    let targetId: string | null = null;
    if (id) {
      const found = await prisma.item.findUnique({
        where: { id },
        select: { id: true, protectedFromOfficialImport: true },
      });
      if (!found) {
        console.error(
          `Row ${rowIndex}: no Item with id ${id}. Use a full row to create.`
        );
        process.exit(1);
      }
      if (itemImportWouldOverwriteProtectedRow(found, forceOfficialImport)) {
        console.warn(
          `[skip] Modifier patch for item id "${id}" skipped (protected from official import; use --force-official-import).`
        );
        skippedProtectedPatch += 1;
        continue;
      }
      targetId = found.id;
    } else if (p.name?.trim()) {
      const nameKey = normalizeItemNameKey(p.name);
      const candidates = await prisma.item.findMany({
        where: { name: p.name.trim() },
        select: {
          id: true,
          name: true,
          protectedFromOfficialImport: true,
        },
      });
      const found = candidates.find(
        (c) => normalizeItemNameKey(c.name) === nameKey
      );
      if (!found) {
        console.error(
          `Row ${rowIndex}: no Item matched name "${p.name}". Use a full row to create.`
        );
        process.exit(1);
      }
      if (itemImportWouldOverwriteProtectedRow(found, forceOfficialImport)) {
        console.warn(
          `[skip] Modifier patch for item "${p.name}" skipped (protected from official import; use --force-official-import).`
        );
        skippedProtectedPatch += 1;
        continue;
      }
      targetId = found.id;
    }

    if (!targetId) {
      console.error(`Row ${rowIndex}: could not resolve item`);
      process.exit(1);
    }

    await prisma.item.update({
      where: { id: targetId },
      data: mapApiModifiersToPrismaFields({
        modifiesAttribute: p.modifiesAttribute,
        attributeMod: p.attributeMod,
        modifiesSkill: p.modifiesSkill,
        skillMod: p.skillMod,
      }),
    });
    patches++;
  }

  console.log(
    `Done. Full upserts: ${fullUpserts}, skippedProtectedFull: ${skippedProtectedFull}, modifier patches: ${patches}, skippedProtectedPatch: ${skippedProtectedPatch}, data rows: ${rows.length}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
