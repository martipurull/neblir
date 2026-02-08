/**
 * Upload items from a CSV file to the Item collection in MongoDB.
 * Validates each row against the Prisma Item schema (via Zod itemSchema).
 * On first validation failure: rolls back all inserts from this run, prints the
 * conflicting item, and exits with code 1 so the CSV can be corrected.
 *
 * Usage: npx tsx prisma/scripts/uploadItemsFromCSV.ts <path-to-items.csv>
 *
 * CSV columns (order flexible via header): name, type, accessType, confCost,
 * costInfo, description, notes, weight, usage, imageKey, attackRoll,
 * attackBonus, damageDiceType, damageNumberOfDice, damageType,
 * damagePrimaryRadius, damageSecondaryRadius, areaEffectDefenceReactionCost,
 * areaEffectDefenceRoll, areaEffectSuccessfulDefenceResult
 *
 * - accessType defaults to PLAYER if missing.
 * - attackRoll: semicolon-separated (e.g. "RANGE;MELEE").
 * - type must be GENERAL_ITEM or WEAPON; weapons require damage fields.
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { MongoClient, ObjectId } from "mongodb";
import { parse } from "csv-parse/sync";
import { itemSchema, type Item } from "../../src/app/lib/types/item";

const ITEM_COLLECTION = "Item";

function parseOptionalInt(value: string | undefined): number | undefined {
  if (value === undefined || value === null || String(value).trim() === "")
    return undefined;
  const n = parseInt(String(value).trim(), 10);
  return Number.isNaN(n) ? undefined : n;
}

function parseOptionalString(value: string | undefined): string | undefined {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  return s === "" ? undefined : s;
}

function parseAttackRoll(value: string | undefined): string[] {
  if (value === undefined || value === null || String(value).trim() === "")
    return [];
  return String(value)
    .split(/[;,]/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

function csvRowToItem(row: Record<string, string>): Item {
  const type = (parseOptionalString(row.type) ?? "").toUpperCase() as
    | "GENERAL_ITEM"
    | "WEAPON";
  const accessType = (parseOptionalString(row.accessType) ?? "PLAYER").toUpperCase() as
    | "PLAYER"
    | "GAME_MASTER";

  const base = {
    type,
    accessType,
    name: parseOptionalString(row.name) ?? "",
    imageKey: parseOptionalString(row.imageKey),
    confCost: parseOptionalInt(row.confCost) ?? 0,
    costInfo: parseOptionalString(row.costInfo),
    description: parseOptionalString(row.description) ?? "",
    notes: parseOptionalString(row.notes),
    weight: parseOptionalInt(row.weight),
  };

  if (type === "GENERAL_ITEM") {
    return {
      ...base,
      type: "GENERAL_ITEM",
      usage: parseOptionalString(row.usage) ?? "",
    };
  }

  const attackBonus = parseOptionalInt(row.attackBonus);
  const diceType = parseOptionalInt(row.damageDiceType);
  const numberOfDice = parseOptionalInt(row.damageNumberOfDice);
  const damageType = parseOptionalString(row.damageType)?.toUpperCase();

  const damage = {
    diceType: diceType ?? 0,
    numberOfDice: numberOfDice ?? 0,
    damageType: (damageType ?? "OTHER") as
      | "BULLET"
      | "BLADE"
      | "SIIKE"
      | "ACID"
      | "FIRE"
      | "ICE"
      | "BLUDGEONING"
      | "OTHER",
    primaryRadius: parseOptionalInt(row.damagePrimaryRadius),
    secondaryRadius: parseOptionalInt(row.damageSecondaryRadius),
    areaEffect:
      parseOptionalInt(row.areaEffectDefenceReactionCost) !== undefined ||
      parseOptionalString(row.areaEffectDefenceRoll) !== undefined ||
      parseOptionalString(row.areaEffectSuccessfulDefenceResult) !== undefined
        ? {
            defenceReactionCost:
              parseOptionalInt(row.areaEffectDefenceReactionCost) ?? 0,
            defenceRoll:
              parseOptionalString(row.areaEffectDefenceRoll) ?? "",
            successfulDefenceResult:
              parseOptionalString(row.areaEffectSuccessfulDefenceResult) ?? "",
          }
        : undefined,
  };

  return {
    ...base,
    type: "WEAPON",
    attackRoll: parseAttackRoll(row.attackRoll) as
      | ("RANGE" | "MELEE" | "GRID" | "THROW")[],
    attackBonus: attackBonus ?? 0,
    damage,
  };
}

function itemToMongoDoc(item: Item): Record<string, unknown> {
  const base: Record<string, unknown> = {
    accessType: item.accessType,
    confCost: item.confCost,
    costInfo: item.costInfo ?? null,
    description: item.description,
    imageKey: item.imageKey ?? null,
    name: item.name,
    notes: item.notes ?? null,
    type: item.type,
    weight: item.weight ?? null,
  };

  if (item.type === "GENERAL_ITEM") {
    return {
      ...base,
      attackRoll: [],
      attackBonus: 0,
      damage: null,
      usage: item.usage ?? null,
    };
  }

  return {
    ...base,
    attackRoll: item.attackRoll,
    attackBonus: item.attackBonus,
    damage: {
      damageType: item.damage.damageType,
      diceType: item.damage.diceType,
      numberOfDice: item.damage.numberOfDice,
      primaryRadius: item.damage.primaryRadius ?? null,
      secondaryRadius: item.damage.secondaryRadius ?? null,
      areaEffect: item.damage.areaEffect ?? null,
    },
    usage: null,
  };
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: npx tsx prisma/scripts/uploadItemsFromCSV.ts <path-to-items.csv>");
    process.exit(1);
  }

  const resolvedPath = path.resolve(csvPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI environment variable is not set");
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
    console.log("CSV has no data rows. Nothing to upload.");
    return;
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db("neblir-dev");
  const collection = db.collection(ITEM_COLLECTION);
  const insertedIds: ObjectId[] = [];

  try {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2; // 1-based + header line

      const candidate = csvRowToItem(row);
      const result = itemSchema.safeParse(candidate);

      if (!result.success) {
        console.error("\n--- Validation failed ---");
        console.error("Row index (1-based, including header):", rowIndex);
        console.error("Conflicting item (parsed from CSV):");
        console.error(JSON.stringify(candidate, null, 2));
        console.error("Zod errors:", result.error.flatten());

        if (insertedIds.length > 0) {
          const deleteResult = await collection.deleteMany({
            _id: { $in: insertedIds },
          });
          console.error(
            `Rollback: removed ${deleteResult.deletedCount} previously inserted item(s).`
          );
        }
        process.exit(1);
      }

      const doc = itemToMongoDoc(result.data);
      const insertResult = await collection.insertOne(doc);
      insertedIds.push(insertResult.insertedId as ObjectId);
    }

    console.log(`Successfully added ${insertedIds.length} item(s) to ${ITEM_COLLECTION}.`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
