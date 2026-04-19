/**
 * Coerces `attributeMod` / `skillMod` (and UniqueItem *Override fields) to BSON int
 * when they are stored as string or double. Prisma `Int` on MongoDB rejects those
 * BSON types, which often happens after manual edits or imports — including for
 * negative values.
 *
 * Safe to run multiple times (only updates mismatched types).
 *
 * Usage: npx tsx prisma/scripts/normalizeItemAttributeSkillMods.ts
 *
 * Env: MONGODB_URI (required). Optional MONGODB_DB_NAME defaults to "neblir-dev".
 */

import "dotenv/config";
import { MongoClient } from "mongodb";

const DB_NAME = process.env.MONGODB_DB_NAME || "neblir-dev";

/** BSON types Prisma `Int` commonly chokes on for these fields */
const NON_INT_SCALAR_TYPES = ["double", "string", "decimal"] as const;

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(DB_NAME);

  const jobs: Array<[string, string]> = [
    ["Item", "attributeMod"],
    ["Item", "skillMod"],
    ["CustomItem", "attributeMod"],
    ["CustomItem", "skillMod"],
    ["UniqueItem", "attributeModOverride"],
    ["UniqueItem", "skillModOverride"],
  ];

  try {
    for (const [collectionName, field] of jobs) {
      const coll = db.collection(collectionName);
      const res = await coll.updateMany(
        {
          [field]: {
            $exists: true,
            $ne: null,
            $type: NON_INT_SCALAR_TYPES,
          },
        },
        [{ $set: { [field]: { $toInt: `$${field}` } } }]
      );
      console.log(
        `${collectionName}.${field}: matched ${res.matchedCount}, modified ${res.modifiedCount}`
      );
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
