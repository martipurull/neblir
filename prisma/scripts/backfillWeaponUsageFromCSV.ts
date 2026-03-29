/**
 * Backfill missing weapon usage values in MongoDB Item documents from CSV.
 *
 * Updates only documents where:
 * - type === "WEAPON"
 * - usage is null, undefined, or empty string
 * - CSV has a non-empty usage value for that weapon name
 *
 * Usage:
 *   npx tsx prisma/scripts/backfillWeaponUsageFromCSV.ts <path-to-items.csv> [--apply]
 *
 * Notes:
 * - Default mode is dry-run (no DB writes).
 * - Pass --apply to persist changes.
 * - Matching is done by item name + type WEAPON.
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import { parse } from "csv-parse/sync";

const ITEM_COLLECTION = "Item";
const DB_NAME = process.env.MONGODB_DB_NAME || "neblir-dev";

type CsvRow = Record<string, string>;

function getColumn(
  row: CsvRow,
  primaryName: string,
  ...aliases: string[]
): string | undefined {
  const names = [primaryName, ...aliases];
  const keys = Object.keys(row);
  for (const name of names) {
    const exact = row[name];
    if (exact !== undefined) return exact;
    const lower = name.toLowerCase();
    const match = keys.find((k) => k.toLowerCase() === lower);
    if (match) return row[match];
  }
  return undefined;
}

function normalizeType(value: string | undefined): string {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function normalizeName(value: string | undefined): string {
  return String(value ?? "").trim();
}

function normalizeUsage(value: string | undefined): string | null {
  const usage = String(value ?? "").trim();
  return usage.length > 0 ? usage : null;
}

function parseWeaponUsageByName(rows: CsvRow[]): Map<string, string> {
  const usageByName = new Map<string, string>();
  for (const row of rows) {
    const type = normalizeType(getColumn(row, "type"));
    if (type !== "WEAPON") continue;

    const name = normalizeName(getColumn(row, "name"));
    const usage = normalizeUsage(getColumn(row, "usage"));
    if (!name || !usage) continue;

    const existing = usageByName.get(name);
    // If CSV has duplicates with conflicting usage for same weapon name,
    // fail fast rather than applying ambiguous updates.
    if (existing && existing !== usage) {
      throw new Error(
        `Conflicting usage in CSV for weapon '${name}': '${existing}' vs '${usage}'`
      );
    }
    usageByName.set(name, usage);
  }
  return usageByName;
}

async function main() {
  const csvPath = process.argv[2];
  const shouldApply = process.argv.includes("--apply");

  if (!csvPath) {
    console.error(
      "Usage: npx tsx prisma/scripts/backfillWeaponUsageFromCSV.ts <path-to-items.csv> [--apply]"
    );
    process.exit(1);
  }

  const resolvedPath = path.resolve(csvPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`CSV file not found: ${resolvedPath}`);
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  const raw = fs.readFileSync(resolvedPath, "utf-8");
  const rows: CsvRow[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  if (rows.length === 0) {
    console.log("CSV has no rows. Nothing to process.");
    return;
  }

  const usageByName = parseWeaponUsageByName(rows);
  if (usageByName.size === 0) {
    console.log("No weapon rows with usage found in CSV. Nothing to update.");
    return;
  }

  const client = new MongoClient(mongoUri);
  await client.connect();

  try {
    const db = client.db(DB_NAME);
    const collection = db.collection(ITEM_COLLECTION);

    let matchedMissingUsage = 0;
    let updatedCount = 0;
    let namesWithNoDbMatch = 0;

    for (const [name, usage] of usageByName.entries()) {
      const filter = {
        type: "WEAPON",
        name,
        $or: [{ usage: null }, { usage: "" }, { usage: { $exists: false } }],
      };

      const matches = await collection.countDocuments(filter);
      if (matches === 0) {
        namesWithNoDbMatch += 1;
        continue;
      }
      matchedMissingUsage += matches;

      if (shouldApply) {
        const result = await collection.updateMany(filter, { $set: { usage } });
        updatedCount += result.modifiedCount;
      }
    }

    console.log(`CSV weapon usage entries: ${usageByName.size}`);
    console.log(
      `DB weapons with missing usage matched: ${matchedMissingUsage}`
    );
    console.log(
      `CSV weapon names with no DB missing-usage match: ${namesWithNoDbMatch}`
    );
    if (shouldApply) {
      console.log(`Updated documents: ${updatedCount}`);
      console.log("Backfill applied.");
    } else {
      console.log("Dry run only. Re-run with --apply to write updates.");
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
