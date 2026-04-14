/**
 * Upsert global Item documents from a CSV (same column conventions as uploadItemsFromCSV).
 *
 * - **Full row**: `type` is GENERAL_ITEM or WEAPON; all columns match the upload script.
 *   Optional `id` / `_id` column: update by that id, or insert with that id if missing.
 *   Without id, match by normalized name (same as JSON upsert).
 * - **Patch row**: omit `type` (or leave empty). Row must include `id`/`_id` or `name`;
 *   only `modifiesAttribute`, `attributeMod`, `modifiesSkill`, `skillMod` are applied
 *   when those columns are non-empty (others unchanged).
 *
 * Usage: npx tsx prisma/scripts/upsertGlobalItemsFromCsv.ts <path-to-items.csv>
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

const prisma = new PrismaClient();

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

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error(
      "Usage: npx tsx prisma/scripts/upsertGlobalItemsFromCsv.ts <path-to-items.csv>"
    );
    process.exit(1);
  }

  const resolvedPath = path.resolve(csvPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
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

  let fullUpserts = 0;
  let patches = 0;

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

      if (idFromRow?.trim()) {
        const existing = await prisma.item.findUnique({
          where: { id: idFromRow.trim() },
        });
        if (existing) {
          await prisma.item.update({
            where: { id: idFromRow.trim() },
            data: { ...createData },
          });
        } else {
          await prisma.item.create({
            data: { ...createData, id: idFromRow.trim() },
          });
        }
      } else {
        const nameKey = normalizeItemNameKey(itemPayload.name);
        const existing = await prisma.item.findFirst({
          where: { name: itemPayload.name.trim() },
        });
        if (existing && normalizeItemNameKey(existing.name) === nameKey) {
          await prisma.item.update({
            where: { id: existing.id },
            data: { ...createData },
          });
        } else {
          await prisma.item.create({ data: createData });
        }
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
      const found = await prisma.item.findUnique({ where: { id } });
      if (!found) {
        console.error(
          `Row ${rowIndex}: no Item with id ${id}. Use a full row to create.`
        );
        process.exit(1);
      }
      targetId = found.id;
    } else if (p.name?.trim()) {
      const nameKey = normalizeItemNameKey(p.name);
      const candidates = await prisma.item.findMany({
        where: { name: p.name.trim() },
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
    `Done. Full upserts: ${fullUpserts}, modifier patches: ${patches}, data rows: ${rows.length}.`
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
