/**
 * Upsert ReferenceEntry rows from a JSON seed file (global or per-game).
 *
 * Usage:
 *   npx tsx prisma/scripts/upsertReferenceEntriesFromFile.ts <path-to.json> [--dry-run] [--force-official-import]
 *
 * JSON root: array of entries, or `{ "reference": [ ... ] }` (catalogue export shape).
 * Rows are validated with referenceEntryCreateSchema (id / timestamps in export are ignored).
 *
 * Env: MONGODB_URI (required).
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { parseOfficialImportArgv } from "./officialImportCli";
import { parseReferenceSeedJson } from "./referenceSeedJsonParse";

const prisma = new PrismaClient();

async function main() {
  const { dryRun, forceOfficialImport, positional } = parseOfficialImportArgv(
    process.argv.slice(2)
  );
  const inputPath = positional[0];
  if (!inputPath) {
    console.error(
      "Usage: npx tsx prisma/scripts/upsertReferenceEntriesFromFile.ts <path-to.json> [--dry-run] [--force-official-import]"
    );
    process.exit(1);
  }

  const resolvedPath = path.resolve(inputPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const rows = parseReferenceSeedJson(fs.readFileSync(resolvedPath, "utf8"));
  if (rows.length === 0) {
    console.log("No reference rows found. Nothing to do.");
    return;
  }

  if (dryRun) {
    for (const row of rows) {
      const game = row.data.gameId ? ` game=${row.data.gameId}` : "";
      console.log(
        `[dry-run] ${row.data.category}/${row.data.slug}: "${row.data.title}"${game}`
      );
    }
    console.log(`Dry run done. Parsed ${rows.length} row(s).`);
    return;
  }

  let created = 0;
  let updated = 0;
  let skippedProtected = 0;

  for (const row of rows) {
    const { category, slug, gameId } = row.data;
    const gameIdValue = gameId ?? null;

    const existing = await prisma.referenceEntry.findFirst({
      where: { category, slug, gameId: gameIdValue },
      select: { id: true, protectedFromOfficialImport: true },
    });

    if (existing?.protectedFromOfficialImport && !forceOfficialImport) {
      console.warn(
        `[skip] Reference ${category}/${slug} is protected from official import (use --force-official-import to overwrite).`
      );
      skippedProtected += 1;
      continue;
    }

    const data = {
      category: row.data.category,
      slug: row.data.slug,
      title: row.data.title,
      summary: row.data.summary ?? null,
      access: row.data.access,
      tags: row.data.tags,
      sortOrder: row.data.sortOrder,
      contentJson: row.data.contentJson ?? null,
      contentHtml: row.data.contentHtml ?? null,
      sourceFile: row.data.sourceFile ?? null,
      gameId: gameIdValue,
    };

    if (existing) {
      await prisma.referenceEntry.update({
        where: { id: existing.id },
        data,
      });
      updated += 1;
      console.log(`Updated ${category}/${slug}`);
      continue;
    }

    if (row.id) {
      await prisma.referenceEntry.create({ data: { ...data, id: row.id } });
    } else {
      await prisma.referenceEntry.create({ data });
    }
    created += 1;
    console.log(`Created ${category}/${slug}`);
  }

  console.log(
    `Done. Parsed ${rows.length} row(s) (created: ${created}, updated: ${updated}, skippedProtected: ${skippedProtected}).`
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
