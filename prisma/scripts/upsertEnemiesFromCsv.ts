/**
 * Upsert official Enemy rows from a CSV file (same columns as custom-enemy export).
 *
 * Usage:
 *   npx tsx prisma/scripts/upsertEnemiesFromCsv.ts <path-to-enemies.csv>
 *   npx tsx prisma/scripts/upsertEnemiesFromCsv.ts ./enemies.csv --dry-run
 *
 * Columns (header row, case-insensitive): same as custom-enemy CSV export — see
 * CUSTOM_ENEMY_CSV_COLUMNS in src/app/lib/enemyCsv.ts. Notably `actions` and `additionalActions`
 * are JSON arrays (escaped in CSV) matching enemyActionSchema; omit or leave empty for [].
 * Damage-type columns use pipe-separated values, e.g. BULLET|FIRE.
 *
 * Env: MONGODB_URI (via dotenv / Prisma).
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/app/lib/prisma/client";
import { parseCustomEnemyCsv } from "@/app/lib/enemyCsv";
import { enemyCreateSchema } from "@/app/lib/types/enemy";

async function main() {
  const csvPath = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");

  if (!csvPath) {
    console.error(
      "Usage: npx tsx prisma/scripts/upsertEnemiesFromCsv.ts <path-to-enemies.csv> [--dry-run]"
    );
    process.exit(1);
  }

  const resolvedPath = path.resolve(csvPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(resolvedPath, "utf8");
  const { rows, rowErrors } = parseCustomEnemyCsv(raw);
  if (rowErrors.length > 0 && rows.length === 0) {
    throw new Error(
      `CSV parse failed:\n${rowErrors.map((e) => `  line ${e.line}: ${e.message}`).join("\n")}`
    );
  }
  if (rowErrors.length > 0) {
    console.warn(
      "Some rows were skipped:\n" +
        rowErrors.map((e) => `  line ${e.line}: ${e.message}`).join("\n")
    );
  }

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const parsed = enemyCreateSchema.safeParse(row);
    if (!parsed.success) {
      throw new Error(
        `Invalid enemy "${row.name}": ${parsed.error.issues.map((i) => i.message).join("; ")}`
      );
    }
    const enemy = parsed.data;
    const existing = await prisma.enemy.findUnique({
      where: { name: enemy.name },
      select: { id: true },
    });
    if (dryRun) {
      console.log(`[dry-run] ${existing ? "update" : "create"} ${enemy.name}`);
      continue;
    }
    await prisma.enemy.upsert({
      where: { name: enemy.name },
      update: enemy,
      create: enemy,
    });
    if (existing) updated += 1;
    else created += 1;
  }

  if (dryRun) {
    console.log(`Dry run done. Parsed ${rows.length} row(s).`);
    return;
  }
  console.log(
    `Done. Upserted ${rows.length} enemy row(s) (created: ${created}, updated: ${updated}).`
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
