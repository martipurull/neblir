/**
 * Upload items from a CSV file to the Item collection in MongoDB.
 * Validates each row against the Prisma Item schema (via Zod itemSchema).
 * On first validation failure: rolls back all inserts from this run, prints the
 * conflicting item, and exits with code 1 so the CSV can be corrected.
 *
 * Usage: npx tsx prisma/scripts/uploadItemsFromCSV.ts <path-to-items.csv>
 *
 * Env: MONGODB_URI (required). Optional MONGODB_DB_NAME defaults to "neblir-dev"
 * (same pattern as other prisma/scripts CSV tools).
 *
 * CSV columns (order flexible via header): name, type, accessType, confCost,
 * costInfo, description, notes, weight, usage, imageKey, equippable,
 * equipSlotTypes, equipSlotCost, maxUses,
 * attackRoll, attackMeleeBonus, attackRangeBonus, attackThrowBonus,
 * defenceMeleeBonus, defenceRangeBonus, gridAttackBonus, gridDefenceBonus,
 * effectiveRange, maxRange,
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
 *
 * Extra guards (upload-only, stricter than bare Zod):
 * - Names must be unique vs the DB and within this CSV after removing all whitespace (e.g. "Iron  Sword" clashes with "IronSword").
 * - WEAPON rows must have non-empty usage.
 * - WEAPON rows with RANGE or THROW in attackRoll must set effectiveRange and maxRange (integers; 0 allowed).
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import type { ObjectId } from "mongodb";
import { MongoClient } from "mongodb";
import { parse } from "csv-parse/sync";
import { itemSchema, type Item } from "../../src/app/lib/types/item";

const ITEM_COLLECTION = "Item";
const DB_NAME = process.env.MONGODB_DB_NAME || "neblir-dev";

/** Dedup key: trim edges, then remove all whitespace so "My Sword" matches "MySword". */
function normalizeItemNameKey(name: string): string {
  return String(name).trim().replace(/\s/g, "");
}

type UploadCheckFailure = {
  message: string;
  details?: Record<string, unknown>;
};

function checkUploadConstraints(
  item: Item,
  rowIndex: number
): UploadCheckFailure | null {
  const nameKey = normalizeItemNameKey(item.name);
  if (!nameKey) {
    return {
      message: "Name is empty or only whitespace",
      details: { rowIndex },
    };
  }

  if (item.type === "WEAPON") {
    const usage = item.usage?.trim() ?? "";
    if (!usage) {
      return {
        message:
          "WEAPON rows must include a non-empty usage (describe action cost / how the weapon is used)",
        details: { rowIndex, name: item.name },
      };
    }

    const needsRange =
      item.attackRoll.includes("RANGE") || item.attackRoll.includes("THROW");
    if (needsRange) {
      if (
        item.effectiveRange === undefined ||
        item.effectiveRange === null ||
        item.maxRange === undefined ||
        item.maxRange === null
      ) {
        return {
          message:
            "WEAPON rows with RANGE or THROW in attackRoll must set effectiveRange and maxRange (integers; use 0 if not applicable)",
          details: {
            rowIndex,
            name: item.name,
            attackRoll: item.attackRoll,
            effectiveRange: item.effectiveRange,
            maxRange: item.maxRange,
          },
        };
      }
    }
  }

  return null;
}

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
    effectiveRange: parseOptionalInt(
      getColumn(row, "effectiveRange", "effective_range")
    ),
    maxRange: parseOptionalInt(getColumn(row, "maxRange", "max_range")),
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
    usage: parseOptionalString(row.usage),
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
    usage?: string;
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
    effectiveRange: item.effectiveRange ?? null,
    maxRange: item.maxRange ?? null,
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
    usage: itemWithEquip.usage ?? null,
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
  const db = client.db(DB_NAME);
  const collection = db.collection(ITEM_COLLECTION);
  const insertedIds: ObjectId[] = [];

  const existingNames = await collection
    .find({}, { projection: { _id: 0, name: 1 } })
    .toArray();
  const usedNameKeys = new Set(
    existingNames.map((d) =>
      normalizeItemNameKey(d.name != null ? String(d.name) : "")
    )
  );

  async function rollbackInsertedThisRun(): Promise<void> {
    if (insertedIds.length === 0) return;
    const deleteResult = await collection.deleteMany({
      _id: { $in: insertedIds },
    });
    console.error(
      `Rollback: removed ${deleteResult.deletedCount} previously inserted item(s).`
    );
  }

  try {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowIndex = i + 2; // 1-based + header line

      const candidate = csvRowToItem(row);
      const zodResult = itemSchema.safeParse(candidate);

      if (zodResult.success) {
        const item = zodResult.data;
        const uploadCheck = checkUploadConstraints(item, rowIndex);
        if (uploadCheck) {
          console.error("\n--- Upload validation failed ---");
          console.error(uploadCheck.message);
          if (uploadCheck.details) {
            console.error("Details:", uploadCheck.details);
          }
          console.error("Parsed item:", JSON.stringify(item, null, 2));

          await rollbackInsertedThisRun();
          process.exit(1);
        }

        const nameKey = normalizeItemNameKey(item.name);
        if (usedNameKeys.has(nameKey)) {
          console.error("\n--- Duplicate name ---");
          console.error("Row index (1-based, including header):", rowIndex);
          console.error(
            `An item already exists in the database or appears earlier in this CSV with the same name key (all whitespace removed for comparison): '${nameKey}'`
          );
          console.error("Parsed name:", item.name);

          await rollbackInsertedThisRun();
          process.exit(1);
        }

        const doc = itemToMongoDoc(item);
        const insertResult = await collection.insertOne(doc);
        insertedIds.push(insertResult.insertedId as ObjectId);
        usedNameKeys.add(nameKey);
      } else {
        console.error("\n--- Validation failed ---");
        console.error("Row index (1-based, including header):", rowIndex);
        console.error("Conflicting item (parsed from CSV):");
        console.error(JSON.stringify(candidate, null, 2));
        console.error("Zod errors:", zodResult.error.flatten());

        await rollbackInsertedThisRun();
        process.exit(1);
      }
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
