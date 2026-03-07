/**
 * Upload items from a CSV file to the Item collection in MongoDB.
 * Validates each row against the Prisma Item schema (via Zod itemSchema).
 * On first validation failure: rolls back all inserts from this run, prints the
 * conflicting item, and exits with code 1 so the CSV can be corrected.
 *
 * Usage: npx tsx prisma/scripts/uploadItemsFromCSV.ts <path-to-items.csv>
 *
 * CSV columns (order flexible via header): name, type, accessType, confCost,
 * costInfo, description, notes, weight, usage, imageKey, equippable,
 * equipSlotTypes, equipSlotCost, maxUses,
 * attackRoll, attackMeleeBonus, attackRangeBonus, attackThrowBonus,
 * defenceMeleeBonus, defenceRangeBonus, gridAttackBonus, gridDefenceBonus,
 * damageDiceType, damageNumberOfDice, damageType, areaType, coneLength,
 * primaryRadius, secondaryRadius (or damagePrimaryRadius, damageSecondaryRadius),
 * areaEffectDefenceReactionCost, areaEffectDefenceRoll, areaEffectSuccessfulDefenceResult
 *
 * - weight is required (number). Use 0 if not applicable.
 * - accessType defaults to PLAYER if missing.
 * - equippable: optional; "true", "1", "yes" (case-insensitive) = true, otherwise false.
 * - equipSlotTypes: optional; semicolon- or comma-separated (e.g. "HAND;BODY"). Values: HAND, FOOT, BODY, HEAD.
 * - equipSlotCost: optional; 0, 1, or 2. Omit or leave empty for no value.
 * - maxUses: optional; positive integer. Omit or leave empty for unlimited/no value.
 * - attackRoll: semicolon- or comma-separated (e.g. "RANGE;MELEE").
 * - type must be GENERAL_ITEM or WEAPON; weapons require damage fields.
 * - damageType: semicolon- or comma-separated list (e.g. "FIRE;BLUDGEONING"). Values: BULLET, BLADE, SIIKE, ACID, FIRE, ICE, BLUDGEONING, ELECTRICITY, NERVE, POISON, OTHER.
 * - areaType: optional; RADIUS or CONE. primaryRadius/secondaryRadius/coneLength apply when area is used.
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import type { ObjectId } from "mongodb";
import { MongoClient } from "mongodb";
import { parse } from "csv-parse/sync";
import { itemSchema, type Item } from "../../src/app/lib/types/item";

const ITEM_COLLECTION = "Item";

/** Get CSV value with flexible column matching (exact, then case-insensitive) */
function getColumn(
  row: Record<string, string>,
  primaryName: string,
  ...aliases: string[]
): string | undefined {
  const names = [primaryName, ...aliases];
  const keys = Object.keys(row);
  for (const name of names) {
    const exact = row[name];
    if (exact !== undefined && exact !== "") return exact;
    const lower = name.toLowerCase();
    const match = keys.find((k) => k.toLowerCase() === lower);
    if (match) return row[match];
  }
  return undefined;
}

function parseOptionalInt(value: string | undefined): number | undefined {
  if (value === undefined || value === null || String(value).trim() === "")
    return undefined;
  const n = parseInt(String(value).trim(), 10);
  return Number.isNaN(n) ? undefined : n;
}

function parseOptionalFloat(value: string | undefined): number | undefined {
  if (value === undefined || value === null || String(value).trim() === "")
    return undefined;
  const n = parseFloat(String(value).trim());
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

function parseBoolean(value: string | undefined): boolean {
  if (value === undefined || value === null) return false;
  const s = String(value).trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

const VALID_EQUIP_SLOT_TYPES = ["HAND", "FOOT", "BODY", "HEAD"] as const;

function parseEquipSlotTypes(
  value: string | undefined
): (typeof VALID_EQUIP_SLOT_TYPES)[number][] {
  if (value === undefined || value === null || String(value).trim() === "")
    return [];
  return String(value)
    .split(/[;,]/)
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is (typeof VALID_EQUIP_SLOT_TYPES)[number] =>
      (VALID_EQUIP_SLOT_TYPES as readonly string[]).includes(s)
    ) as (typeof VALID_EQUIP_SLOT_TYPES)[number][];
}

function parseEquipSlotCost(value: string | undefined): 0 | 1 | 2 | undefined {
  const n = parseOptionalInt(value);
  if (n === undefined) return undefined;
  if (n === 0 || n === 1 || n === 2) return n;
  return undefined;
}

const VALID_DAMAGE_TYPES = [
  "BULLET",
  "BLADE",
  "SIIKE",
  "ACID",
  "FIRE",
  "ICE",
  "BLUDGEONING",
  "ELECTRICITY",
  "NERVE",
  "POISON",
  "OTHER",
] as const;

function parseDamageTypes(
  value: string | undefined
): (typeof VALID_DAMAGE_TYPES)[number][] {
  if (value === undefined || value === null || String(value).trim() === "")
    return ["OTHER"];
  return String(value)
    .split(/[;,]/)
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is (typeof VALID_DAMAGE_TYPES)[number] =>
      (VALID_DAMAGE_TYPES as readonly string[]).includes(s)
    ) as (typeof VALID_DAMAGE_TYPES)[number][];
}

function csvRowToItem(row: Record<string, string>): Item {
  const type = (parseOptionalString(row.type) ?? "").toUpperCase() as
    | "GENERAL_ITEM"
    | "WEAPON";
  const accessType = (
    parseOptionalString(row.accessType) ?? "PLAYER"
  ).toUpperCase() as "PLAYER" | "GAME_MASTER";

  const base = {
    type,
    accessType,
    name: parseOptionalString(row.name) ?? "",
    imageKey: parseOptionalString(row.imageKey),
    confCost: parseOptionalInt(row.confCost) ?? 0,
    costInfo: parseOptionalString(row.costInfo),
    description: parseOptionalString(row.description) ?? "",
    notes: parseOptionalString(row.notes),
    weight: parseOptionalFloat(row.weight) ?? 0,
    equippable: parseBoolean(row.equippable),
    equipSlotTypes: parseEquipSlotTypes(
      getColumn(row, "equipSlotTypes", "equip_slot_types", "Equip Slot Types")
    ),
    equipSlotCost: parseEquipSlotCost(
      getColumn(row, "equipSlotCost", "equip_slot_cost", "Equip Slot Cost")
    ),
    maxUses: parseOptionalInt(
      getColumn(row, "maxUses", "max_uses", "Max Uses")
    ),
    defenceMeleeBonus: parseOptionalInt(row.defenceMeleeBonus),
    defenceRangeBonus: parseOptionalInt(row.defenceRangeBonus),
    gridAttackBonus: parseOptionalInt(
      getColumn(row, "gridAttackBonus", "GridAttackBonus", "grid_attack_bonus")
    ),
    gridDefenceBonus: parseOptionalInt(
      getColumn(
        row,
        "gridDefenceBonus",
        "GridDefenceBonus",
        "grid_defence_bonus"
      )
    ),
  };

  if (type === "GENERAL_ITEM") {
    return {
      ...base,
      type: "GENERAL_ITEM",
      usage: parseOptionalString(row.usage) ?? "",
    };
  }

  const diceType = parseOptionalInt(row.damageDiceType);
  const numberOfDice = parseOptionalInt(row.damageNumberOfDice);
  const damageTypeArr = parseDamageTypes(row.damageType);
  const areaType = parseOptionalString(row.areaType)?.toUpperCase() as
    | "RADIUS"
    | "CONE"
    | undefined;
  const primaryRadius =
    parseOptionalInt(row.primaryRadius) ??
    parseOptionalInt(row.damagePrimaryRadius);
  const secondaryRadius =
    parseOptionalInt(row.secondaryRadius) ??
    parseOptionalInt(row.damageSecondaryRadius);

  const damage = {
    diceType: diceType ?? 0,
    numberOfDice: numberOfDice ?? 0,
    damageType: damageTypeArr,
    areaType:
      areaType === "RADIUS" || areaType === "CONE" ? areaType : undefined,
    coneLength: parseOptionalInt(row.coneLength),
    primaryRadius,
    secondaryRadius,
    areaEffect:
      parseOptionalInt(row.areaEffectDefenceReactionCost) !== undefined ||
      parseOptionalString(row.areaEffectDefenceRoll) !== undefined ||
      parseOptionalString(row.areaEffectSuccessfulDefenceResult) !== undefined
        ? {
            defenceReactionCost:
              parseOptionalInt(row.areaEffectDefenceReactionCost) ?? 0,
            defenceRoll: parseOptionalString(row.areaEffectDefenceRoll) ?? "",
            successfulDefenceResult:
              parseOptionalString(row.areaEffectSuccessfulDefenceResult) ?? "",
          }
        : undefined,
  };

  return {
    ...base,
    type: "WEAPON",
    attackRoll: parseAttackRoll(row.attackRoll) as (
      | "RANGE"
      | "MELEE"
      | "GRID"
      | "THROW"
    )[],
    attackMeleeBonus: parseOptionalInt(row.attackMeleeBonus),
    attackRangeBonus: parseOptionalInt(row.attackRangeBonus),
    attackThrowBonus: parseOptionalInt(row.attackThrowBonus),
    damage,
  };
}

function itemToMongoDoc(item: Item): Record<string, unknown> {
  const itemWithEquip = item as Item & {
    equipSlotTypes?: string[];
    equipSlotCost?: number;
  };
  const base: Record<string, unknown> = {
    accessType: item.accessType,
    confCost: item.confCost,
    costInfo: item.costInfo ?? null,
    description: item.description,
    imageKey: item.imageKey ?? null,
    name: item.name,
    notes: item.notes ?? null,
    type: item.type,
    weight: item.weight,
    equippable: item.equippable ?? false,
    equipSlotTypes: itemWithEquip.equipSlotTypes ?? [],
    equipSlotCost: itemWithEquip.equipSlotCost ?? null,
    maxUses: item.maxUses ?? null,
    defenceMeleeBonus: item.defenceMeleeBonus ?? null,
    defenceRangeBonus: item.defenceRangeBonus ?? null,
    gridAttackBonus: item.gridAttackBonus ?? null,
    gridDefenceBonus: item.gridDefenceBonus ?? null,
  };

  if (item.type === "GENERAL_ITEM") {
    return {
      ...base,
      attackRoll: [],
      attackMeleeBonus: null,
      attackRangeBonus: null,
      attackThrowBonus: null,
      damage: null,
      usage: item.usage ?? null,
    };
  }

  return {
    ...base,
    attackRoll: item.attackRoll,
    attackMeleeBonus: item.attackMeleeBonus ?? null,
    attackRangeBonus: item.attackRangeBonus ?? null,
    attackThrowBonus: item.attackThrowBonus ?? null,
    damage: {
      damageType: item.damage.damageType,
      diceType: item.damage.diceType,
      numberOfDice: item.damage.numberOfDice,
      areaType: item.damage.areaType ?? null,
      coneLength: item.damage.coneLength ?? null,
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
    console.error(
      "Usage: npx tsx prisma/scripts/uploadItemsFromCSV.ts <path-to-items.csv>"
    );
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

    console.log(
      `Successfully added ${insertedIds.length} item(s) to ${ITEM_COLLECTION}.`
    );
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
