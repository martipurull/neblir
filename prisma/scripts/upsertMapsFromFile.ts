import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { parseOfficialImportArgv } from "./officialImportCli";

const prisma = new PrismaClient();

const mapRowSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1),
  imageKey: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  gameId: z.string().nullable().optional(),
});

type MapRow = z.infer<typeof mapRowSchema>;

function usage(): never {
  console.error(
    "Usage: npx tsx prisma/scripts/upsertMapsFromFile.ts <path-to-maps.csv|json> [--dry-run]"
  );
  process.exit(1);
}

function parseJsonRows(raw: string): MapRow[] {
  const parsed = JSON.parse(raw) as unknown;
  const entries = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as { maps?: unknown[] }).maps)
      ? (parsed as { maps: unknown[] }).maps
      : null;
  if (!entries) {
    throw new Error('JSON root must be an array or object with "maps" array.');
  }
  return entries.map((entry, index) => {
    const parsedEntry = mapRowSchema.safeParse(entry);
    if (!parsedEntry.success) {
      throw new Error(
        `JSON map ${index + 1}: ${parsedEntry.error.issues.map((i) => i.message).join("; ")}`
      );
    }
    return parsedEntry.data;
  });
}

function parseCsvRows(raw: string): MapRow[] {
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];
  return rows.map((row, index) => {
    const parsedRow = mapRowSchema.safeParse({
      id: row.id || row._id || undefined,
      name: row.name,
      imageKey: row.imageKey,
      description: row.description || null,
      gameId: row.gameId || null,
    });
    if (!parsedRow.success) {
      throw new Error(
        `CSV row ${index + 2}: ${parsedRow.error.issues.map((i) => i.message).join("; ")}`
      );
    }
    return parsedRow.data;
  });
}

async function main() {
  const { dryRun, forceOfficialImport, positional } = parseOfficialImportArgv(
    process.argv.slice(2)
  );
  const inputPath = positional[0];
  if (!inputPath) usage();

  const resolvedPath = path.resolve(inputPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const raw = fs.readFileSync(resolvedPath, "utf8");
  const ext = path.extname(resolvedPath).toLowerCase();
  const rows = ext === ".json" ? parseJsonRows(raw) : parseCsvRows(raw);
  if (rows.length === 0) {
    console.log("No map rows found. Nothing to do.");
    return;
  }
  if (dryRun) {
    console.log(`[dry-run] Parsed ${rows.length} map row(s).`);
    return;
  }

  let created = 0;
  let updated = 0;
  let skippedProtected = 0;
  for (const row of rows) {
    const existing = await prisma.map.findUnique({
      where: { name: row.name },
      select: { id: true, protectedFromOfficialImport: true },
    });
    if (existing?.protectedFromOfficialImport && !forceOfficialImport) {
      console.warn(
        `[skip] Map "${row.name}" is protected from official import (use --force-official-import to overwrite).`
      );
      skippedProtected += 1;
      continue;
    }
    const data = {
      name: row.name,
      imageKey: row.imageKey,
      description: row.description ?? null,
      gameId: row.gameId ?? null,
    };
    if (existing) {
      await prisma.map.update({ where: { id: existing.id }, data });
      updated++;
    } else if (row.id?.trim()) {
      await prisma.map.create({ data: { ...data, id: row.id.trim() } });
      created++;
    } else {
      await prisma.map.create({ data });
      created++;
    }
  }

  console.log(
    `Done. Upserted ${rows.length} map row(s) (created: ${created}, updated: ${updated}, skippedProtected: ${skippedProtected}).`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
