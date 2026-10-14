/**
 * Upsert Official currency rows from JSON.
 *
 * Usage:
 *   npx tsx prisma/scripts/upsertCurrenciesFromFile.ts <path-to-Currency_Upload.json>
 *   npx tsx prisma/scripts/upsertCurrenciesFromFile.ts prisma/data/Currency_Upload.json --dry-run
 *
 * Each row needs a name, an image key, and an exchange value that is a positive
 * whole number. CONF's exchange value is 1. NORD, NAS, HUMF, and MRARK are left
 * for the maintainer to write; import refuses a missing or invalid value.
 *
 * Env: MONGODB_URI (via dotenv / Prisma).
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { parseCurrencySeedJson } from "@/app/lib/currencySeed";
import { prisma } from "@/app/lib/prisma/client";
import { parseOfficialImportArgv } from "./officialImportCli";

async function main() {
  const { dryRun, forceOfficialImport, positional } = parseOfficialImportArgv(
    process.argv.slice(2)
  );
  const inputPath = positional[0];
  if (!inputPath) {
    console.error(
      "Usage: npx tsx prisma/scripts/upsertCurrenciesFromFile.ts <path-to-currencies.json> [--dry-run]"
    );
    process.exit(1);
  }

  const resolvedPath = path.resolve(inputPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const rows = parseCurrencySeedJson(fs.readFileSync(resolvedPath, "utf8"));
  if (rows.length === 0) {
    console.log("No currency rows found. Nothing to do.");
    return;
  }

  let created = 0;
  let updated = 0;
  let skippedProtected = 0;
  for (const row of rows) {
    const existing = await prisma.currency.findUnique({
      where: { name: row.name },
      select: { id: true, protectedFromOfficialImport: true },
    });
    if (dryRun) {
      console.log(`[dry-run] ${existing ? "update" : "create"} ${row.name}`);
      continue;
    }
    if (existing?.protectedFromOfficialImport && !forceOfficialImport) {
      console.warn(
        `[skip] Currency "${row.name}" is protected from official import (use --force-official-import to overwrite).`
      );
      skippedProtected += 1;
      continue;
    }
    const data = {
      name: row.name,
      exchangeValue: row.exchangeValue,
      imageKey: row.imageKey,
    };
    if (existing) {
      await prisma.currency.update({ where: { id: existing.id }, data });
      updated += 1;
    } else if (row.id) {
      await prisma.currency.create({ data: { ...data, id: row.id } });
      created += 1;
    } else {
      await prisma.currency.create({ data });
      created += 1;
    }
  }

  if (dryRun) {
    console.log(`Dry run done. Parsed ${rows.length} currency row(s).`);
    return;
  }
  console.log(
    `Done. Upserted ${rows.length} currency row(s) (created: ${created}, updated: ${updated}, skippedProtected: ${skippedProtected}).`
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
