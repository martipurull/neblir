/**
 * Ensures all global Items, CustomItems, and UniqueItems have modifier fields
 * present in BSON (set to null when missing). Safe to run multiple times.
 *
 * Usage: npx tsx prisma/scripts/backfillItemModifierNulls.ts
 *
 * Env: MONGODB_URI (required). Optional MONGODB_DB_NAME defaults to "neblir-dev".
 */

import "dotenv/config";
import { MongoClient } from "mongodb";

const DB_NAME = process.env.MONGODB_DB_NAME || "neblir-dev";

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(DB_NAME);

  const itemRes = await db.collection("Item").updateMany({}, [
    {
      $set: {
        modifiesAttribute: { $ifNull: ["$modifiesAttribute", null] },
        attributeMod: { $ifNull: ["$attributeMod", null] },
        modifiesSkill: { $ifNull: ["$modifiesSkill", null] },
        skillMod: { $ifNull: ["$skillMod", null] },
      },
    },
  ]);

  const customRes = await db.collection("CustomItem").updateMany({}, [
    {
      $set: {
        modifiesAttribute: { $ifNull: ["$modifiesAttribute", null] },
        attributeMod: { $ifNull: ["$attributeMod", null] },
        modifiesSkill: { $ifNull: ["$modifiesSkill", null] },
        skillMod: { $ifNull: ["$skillMod", null] },
      },
    },
  ]);

  const uniqueRes = await db.collection("UniqueItem").updateMany({}, [
    {
      $set: {
        modifiesAttributeOverride: {
          $ifNull: ["$modifiesAttributeOverride", null],
        },
        attributeModOverride: { $ifNull: ["$attributeModOverride", null] },
        modifiesSkillOverride: { $ifNull: ["$modifiesSkillOverride", null] },
        skillModOverride: { $ifNull: ["$skillModOverride", null] },
      },
    },
  ]);

  console.log("Item:", itemRes.modifiedCount, "documents touched");
  console.log("CustomItem:", customRes.modifiedCount, "documents touched");
  console.log("UniqueItem:", uniqueRes.modifiedCount, "documents touched");

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
