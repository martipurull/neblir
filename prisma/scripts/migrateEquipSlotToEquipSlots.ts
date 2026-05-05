/**
 * One-time migration: convert equipSlot to equipSlots on ItemCharacter documents.
 * Run with: npx tsx scripts/migrate-equipSlot-to-equipSlots.ts
 * Requires MONGODB_URI in environment.
 */
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}
const mongoUri = uri;

async function main() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection("ItemCharacter");
    const withEquipSlot = await collection
      .find({ equipSlot: { $exists: true, $ne: null } })
      .toArray();
    if (withEquipSlot.length === 0) {
      console.log("No documents to migrate.");
      return;
    }
    let updated = 0;
    for (const doc of withEquipSlot) {
      await collection.updateOne(
        { _id: doc._id },
        {
          $set: { equipSlots: [doc.equipSlot] },
          $unset: { equipSlot: "" },
        }
      );
      updated++;
    }
    console.log(`Migrated ${updated} documents.`);
  } finally {
    await client.close();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
