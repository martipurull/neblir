/**
 * Backfill Item.effectiveRange and Item.maxRange in MongoDB from CSV.
 *
 * Usage:
 *   npx tsx prisma/scripts/backfillItemRangesFromCSV.ts <path-to-items.csv> [--apply] [--overwrite]
 *
 * Notes:
 * - Default mode is dry-run (no DB writes).
 * - Matching is done by item name + item type.
 * - By default, only missing range values are filled in DB.
 * - Pass --overwrite to always set values from CSV, even when DB already has values.
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import { parse } from "csv-parse/sync";

const ITEM_COLLECTION = "Item";
const DB_NAME = process.env.MONGODB_DB_NAME || "neblir-dev";

type CsvRow = Record<string, string>;

type RangePayload = {
  type: string;
  name: string;
  effectiveRange?: number;
  maxRange?: number;
};

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

function parseIntegerOrUndefined(
  row: CsvRow,
  ...columnNames: string[]
): number | undefined {
  const raw = getColumn(row, columnNames[0], ...columnNames.slice(1));
  const value = String(raw ?? "").trim();
  if (!value) return undefined;

  if (!/^-?\d+$/.test(value)) {
    throw new Error(
      `Invalid integer '${value}' for column '${columnNames[0]}'`
    );
  }

  return Number.parseInt(value, 10);
}

function itemKey(type: string, name: string): string {
  return `${type}::${name}`;
}

function parseRangesByItem(rows: CsvRow[]): Map<string, RangePayload> {
  const byItem = new Map<string, RangePayload>();

  for (const row of rows) {
    const type = normalizeType(getColumn(row, "type"));
    const name = normalizeName(getColumn(row, "name"));
    if (!type || !name) continue;

    const effectiveRange = parseIntegerOrUndefined(
      row,
      "effectiveRange",
      "effective_range"
    );
    const maxRange = parseIntegerOrUndefined(row, "maxRange", "max_range");

    // Skip rows that do not provide either range value.
    if (effectiveRange === undefined && maxRange === undefined) {
      continue;
    }

    const key = itemKey(type, name);
    const existing = byItem.get(key);

    if (existing) {
      const sameEffective = existing.effectiveRange === effectiveRange;
      const sameMax = existing.maxRange === maxRange;
      if (!sameEffective || !sameMax) {
        throw new Error(
          `Conflicting range values in CSV for item '${type}/${name}'`
        );
      }
      continue;
    }

    byItem.set(key, { type, name, effectiveRange, maxRange });
  }

  return byItem;
}

async function main() {
  const csvPath = process.argv[2];
  const shouldApply = process.argv.includes("--apply");
  const shouldOverwrite = process.argv.includes("--overwrite");

  if (!csvPath) {
    console.error(
      "Usage: npx tsx prisma/scripts/backfillItemRangesFromCSV.ts <path-to-items.csv> [--apply] [--overwrite]"
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

  const rangesByItem = parseRangesByItem(rows);
  if (rangesByItem.size === 0) {
    console.log("No rows with effectiveRange/maxRange found in CSV.");
    return;
  }

  const client = new MongoClient(mongoUri);
  await client.connect();

  try {
    const db = client.db(DB_NAME);
    const collection = db.collection(ITEM_COLLECTION);

    let matchedDocuments = 0;
    let modifiedDocuments = 0;
    let noMatchItems = 0;

    for (const payload of rangesByItem.values()) {
      const filter: Record<string, unknown> = {
        type: payload.type,
        name: payload.name,
      };

      if (!shouldOverwrite) {
        const missingConditions: Array<Record<string, unknown>> = [];

        if (payload.effectiveRange !== undefined) {
          missingConditions.push(
            { effectiveRange: null },
            { effectiveRange: { $exists: false } }
          );
        }
        if (payload.maxRange !== undefined) {
          missingConditions.push(
            { maxRange: null },
            { maxRange: { $exists: false } }
          );
        }

        if (missingConditions.length > 0) {
          filter.$or = missingConditions;
        }
      }

      const updateSet: Record<string, number> = {};
      if (payload.effectiveRange !== undefined) {
        updateSet.effectiveRange = payload.effectiveRange;
      }
      if (payload.maxRange !== undefined) {
        updateSet.maxRange = payload.maxRange;
      }

      const matches = await collection.countDocuments(filter);
      if (matches === 0) {
        noMatchItems += 1;
        continue;
      }
      matchedDocuments += matches;

      if (shouldApply) {
        const result = await collection.updateMany(filter, { $set: updateSet });
        modifiedDocuments += result.modifiedCount;
      }
    }

    console.log(`CSV item entries with ranges: ${rangesByItem.size}`);
    console.log(`DB documents matched: ${matchedDocuments}`);
    console.log(`CSV items with no DB match: ${noMatchItems}`);
    console.log(`Mode: ${shouldOverwrite ? "overwrite" : "fill-missing-only"}`);

    if (shouldApply) {
      console.log(`Updated documents: ${modifiedDocuments}`);
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
