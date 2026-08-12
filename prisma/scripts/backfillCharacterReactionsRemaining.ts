/**
 * Sets combatInformation.reactionsRemaining = reactionsPerRound when the field
 * is missing or null. Uses the MongoDB driver because Prisma cannot read
 * Character documents while a required Int is still null (P2032).
 * Safe to run multiple times.
 *
 * Usage: npx tsx prisma/scripts/backfillCharacterReactionsRemaining.ts
 * Or: npm run prisma:backfill:character-reactions-remaining
 *
 * Env: MONGODB_URI (required; database name comes from the URI path).
 */

import "dotenv/config";
import { MongoClient } from "mongodb";

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  // Use the database from the URI (no separate MONGODB_DB_NAME default).
  const db = client.db();

  const result = await db.collection("Character").updateMany({}, [
    {
      $set: {
        "combatInformation.reactionsRemaining": {
          $ifNull: [
            "$combatInformation.reactionsRemaining",
            "$combatInformation.reactionsPerRound",
          ],
        },
      },
    },
  ]);

  console.log(
    `Backfilled reactionsRemaining: matched ${result.matchedCount}, modified ${result.modifiedCount}.`
  );

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
