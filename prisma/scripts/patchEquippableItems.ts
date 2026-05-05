/**
 * Patch existing Item documents: add equipSlotTypes and equipSlotCost to
 * equippable items that are missing them. Use when items were uploaded before
 * these fields existed in the CSV/script.
 *
 * Defaults for equippable items missing data:
 *   equipSlotTypes: ["HAND"]
 *   equipSlotCost: 1
 *
 * Usage: npx tsx scripts/patch-equippable-items.ts
 * Requires: MONGODB_URI in env
 */

import "dotenv/config";
import { MongoClient } from "mongodb";

const ITEM_COLLECTION = "Item";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) {
    console.log("Dry run - no changes will be made.\n");
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db("neblir-dev");
  const collection = db.collection(ITEM_COLLECTION);

  const equippableMissing = await collection
    .find({
      equippable: true,
      $or: [
        { equipSlotTypes: { $exists: false } },
        { equipSlotTypes: { $size: 0 } },
        { equipSlotCost: { $exists: false } },
        { equipSlotCost: null },
      ],
    })
    .toArray();

  if (equippableMissing.length === 0) {
    console.log("No equippable items need patching.");
    await client.close();
    return;
  }

  console.log(
    `Found ${equippableMissing.length} equippable item(s) missing equipSlotTypes/equipSlotCost.`
  );

  const defaultEquipSlotTypes = ["HAND"];
  const defaultEquipSlotCost = 1;

  let updated = 0;
  for (const doc of equippableMissing) {
    const update: { $set: Record<string, unknown> } = { $set: {} };
    if (
      !doc.equipSlotTypes ||
      !Array.isArray(doc.equipSlotTypes) ||
      doc.equipSlotTypes.length === 0
    ) {
      update.$set.equipSlotTypes = defaultEquipSlotTypes;
    }
    if (doc.equipSlotCost == null) {
      update.$set.equipSlotCost = defaultEquipSlotCost;
    }
    if (Object.keys(update.$set).length > 0) {
      if (!dryRun) {
        await collection.updateOne({ _id: doc._id }, update);
      }
      updated++;
      console.log(
        `  ${dryRun ? "Would patch" : "Patched"}: ${doc.name} (${doc._id})`
      );
    }
  }

  console.log(`Updated ${updated} item(s).`);
  await client.close();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
/**
 * Patch existing Item documents: add equipSlotTypes and equipSlotCost to
 * equippable items that are missing them. Use when items were uploaded before
 * these fields existed in the CSV/script.
 *
 * Defaults for equippable items missing data:
 *   equipSlotTypes: ["HAND"]
 *   equipSlotCost: 1
 *
 * Usage: npx tsx scripts/patch-equippable-items.ts
 * Requires: MONGODB_URI in env. DB name: scripts/lib/resolveMongoScriptDbName.ts (MONGODB_DB_NAME / MONGODB_TARGET).
 */

import "dotenv/config";
import type { ObjectId } from "mongodb";
import { MongoClient } from "mongodb";
import { resolveMongoScriptDbName } from "./lib/resolveMongoScriptDbName";

const ITEM_COLLECTION = "Item";

type EquippableItemDoc = {
  _id: ObjectId;
  name: string;
  equipSlotTypes?: string[] | null;
  equipSlotCost?: number | null;
};

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) {
    console.log("Dry run – no changes will be made.\n");
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(resolveMongoScriptDbName());
  const collection = db.collection<EquippableItemDoc>(ITEM_COLLECTION);

  const equippableMissing = await collection
    .find({
      equippable: true,
      $or: [
        { equipSlotTypes: { $exists: false } },
        { equipSlotTypes: { $size: 0 } },
        { equipSlotCost: { $exists: false } },
        { equipSlotCost: null },
      ],
    })
    .toArray();

  if (equippableMissing.length === 0) {
    console.log("No equippable items need patching.");
    await client.close();
    return;
  }

  console.log(
    `Found ${equippableMissing.length} equippable item(s) missing equipSlotTypes/equipSlotCost.`
  );

  const defaultEquipSlotTypes = ["HAND"];
  const defaultEquipSlotCost = 1;

  let updated = 0;
  for (const doc of equippableMissing) {
    const update: { $set: Partial<EquippableItemDoc> } = { $set: {} };
    if (
      !doc.equipSlotTypes ||
      !Array.isArray(doc.equipSlotTypes) ||
      doc.equipSlotTypes.length === 0
    ) {
      update.$set.equipSlotTypes = defaultEquipSlotTypes;
    }
    if (doc.equipSlotCost == null) {
      update.$set.equipSlotCost = defaultEquipSlotCost;
    }
    if (Object.keys(update.$set).length > 0) {
      if (!dryRun) {
        await collection.updateOne({ _id: doc._id }, update);
      }
      updated++;
      console.log(
        `  ${dryRun ? "Would patch" : "Patched"}: ${doc.name} (${doc._id})`
      );
    }
  }

  console.log(`Updated ${updated} item(s).`);
  await client.close();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
