/**
 * Sets health.madnessSaves to { successes: 0, failures: 0 } when the field is
 * missing or null. Optional on the Prisma type so reads already tolerate absence,
 * but backfilling keeps documents consistent with deathSaves and avoids
 * write-time surprises when the whole health composite is replaced.
 * Safe to run multiple times.
 *
 * Usage: npx tsx prisma/scripts/backfillCharacterMadnessSaves.ts
 * Or: npm run prisma:backfill:character-madness-saves
 *
 * Env: MONGODB_URI (required; database name comes from the URI path).
 */

import "dotenv/config";
import { MongoClient } from "mongodb";

const EMPTY_MADNESS = { successes: 0, failures: 0 };

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI environment variable is not set");
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db();

  const result = await db.collection("Character").updateMany(
    {
      $or: [
        { "health.madnessSaves": { $exists: false } },
        { "health.madnessSaves": null },
      ],
    },
    {
      $set: {
        "health.madnessSaves": EMPTY_MADNESS,
      },
    }
  );

  console.log(
    `Backfilled madnessSaves: matched ${result.matchedCount}, modified ${result.modifiedCount}.`
  );

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
