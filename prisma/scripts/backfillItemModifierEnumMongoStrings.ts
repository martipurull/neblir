/**
 * Prisma MongoDB enums use @map strings in BSON (e.g. dexterity.stealth), not
 * enum member names (DEXTERITY_STEALTH). Some documents store the latter — often
 * after tooling/version drift — and Prisma then throws on findUnique:
 * "Value 'DEXTERITY_STEALTH' not found in enum 'ItemAttributePath'".
 *
 * Rewrites wrong strings to the mapped form. Safe to run multiple times.
 *
 * Usage: npx tsx prisma/scripts/backfillItemModifierEnumMongoStrings.ts
 *
 * Env: MONGODB_URI (required). Optional MONGODB_DB_NAME defaults to "neblir-dev".
 */

import "dotenv/config";
import { MongoClient } from "mongodb";
import {
  ATTRIBUTE_PATH_API_TO_PRISMA,
  GENERAL_SKILL_API_TO_PRISMA,
} from "@/app/lib/itemModifierEnums";

const DB_NAME = process.env.MONGODB_DB_NAME || "neblir-dev";

function wrongPrismaStringsToMongo(
  apiToPrisma: Record<string, string>
): Array<[string, string]> {
  return Object.entries(apiToPrisma).map(([apiPath, prismaMember]) => [
    prismaMember,
    apiPath,
  ]);
}

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  const attrPairs = wrongPrismaStringsToMongo(
    ATTRIBUTE_PATH_API_TO_PRISMA as Record<string, string>
  );
  const skillPairs = wrongPrismaStringsToMongo(
    GENERAL_SKILL_API_TO_PRISMA as Record<string, string>
  );

  const jobs: Array<{
    collection: string;
    field: string;
    pairs: Array<[string, string]>;
  }> = [
    { collection: "Item", field: "modifiesAttribute", pairs: attrPairs },
    { collection: "CustomItem", field: "modifiesAttribute", pairs: attrPairs },
    {
      collection: "UniqueItem",
      field: "modifiesAttributeOverride",
      pairs: attrPairs,
    },
    { collection: "Item", field: "modifiesSkill", pairs: skillPairs },
    { collection: "CustomItem", field: "modifiesSkill", pairs: skillPairs },
    {
      collection: "UniqueItem",
      field: "modifiesSkillOverride",
      pairs: skillPairs,
    },
  ];

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(DB_NAME);

  try {
    for (const { collection, field, pairs } of jobs) {
      const coll = db.collection(collection);
      for (const [wrong, right] of pairs) {
        if (wrong === right) continue;
        const res = await coll.updateMany(
          { [field]: wrong },
          { $set: { [field]: right } }
        );
        if (res.matchedCount > 0) {
          console.log(
            `${collection}.${field}: "${wrong}" -> "${right}": matched ${res.matchedCount}, modified ${res.modifiedCount}`
          );
        }
      }
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
