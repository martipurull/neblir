/**
 * Points each character holding at the catalogue currency of the same name
 * and keeps the quantity. Fails before writing if any of the five seeded
 * currencies is missing, or if a holding's name matches no currency.
 *
 * Import currencies first (`npm run data:import:currencies`), then run:
 *   npm run prisma:migrate:character-currency
 *
 * Env: MONGODB_URI (required; database name comes from the URI path).
 * Safe to run again: rows that already have no currencyName are left alone.
 *
 * The old unique index on (characterId, currencyName) treats a removed name as
 * null. Drop it before unsetting currencyName, or the second holding for a
 * character collides with the first.
 */

import "dotenv/config";
import { MongoClient, type ObjectId } from "mongodb";

const SEEDED_CURRENCY_NAMES = ["CONF", "NORD", "NAS", "HUMF", "MRARK"] as const;
const LEGACY_HOLDING_NAME_INDEX =
  "CharacterCurrency_characterId_currencyName_key";

type CurrencyDocument = {
  _id: ObjectId;
  name?: string;
};

type HoldingDocument = {
  _id: ObjectId;
  currencyName?: string;
};

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const client = new MongoClient(mongoUri);
  await client.connect();

  try {
    const db = client.db();
    const currencies = await db
      .collection<CurrencyDocument>("Currency")
      .find({})
      .toArray();
    const currencyIdByName = new Map<string, ObjectId>();
    for (const currency of currencies) {
      if (typeof currency.name === "string") {
        currencyIdByName.set(currency.name, currency._id);
      }
    }

    const missingSeeded = SEEDED_CURRENCY_NAMES.filter(
      (name) => !currencyIdByName.has(name)
    );
    if (missingSeeded.length > 0) {
      throw new Error(
        `Seeded currencies are not imported (${missingSeeded.join(", ")}). Import currencies before migrating holdings.`
      );
    }

    const holdings = await db
      .collection<HoldingDocument>("CharacterCurrency")
      .find({ currencyName: { $exists: true } })
      .toArray();

    const unmatched: { id: string; currencyName: string }[] = [];
    const planned: { id: ObjectId; currencyId: ObjectId }[] = [];
    for (const holding of holdings) {
      const currencyName = holding.currencyName ?? "";
      const currencyId = currencyIdByName.get(currencyName);
      if (!currencyId) {
        unmatched.push({ id: String(holding._id), currencyName });
        continue;
      }
      planned.push({ id: holding._id, currencyId });
    }

    if (unmatched.length > 0) {
      const sample = unmatched
        .slice(0, 10)
        .map((row) => `${row.id} (${row.currencyName || "blank"})`)
        .join(", ");
      throw new Error(
        `Migration failed: ${unmatched.length} holding(s) match no currency: ${sample}`
      );
    }

    const characterCurrencies = db.collection("CharacterCurrency");
    const indexes = await characterCurrencies.indexes();
    if (indexes.some((index) => index.name === LEGACY_HOLDING_NAME_INDEX)) {
      await characterCurrencies.dropIndex(LEGACY_HOLDING_NAME_INDEX);
      console.log(`Dropped legacy index ${LEGACY_HOLDING_NAME_INDEX}.`);
    }

    for (const row of planned) {
      await characterCurrencies.updateOne(
        { _id: row.id },
        {
          $set: { currencyId: row.currencyId },
          $unset: { currencyName: "" },
        }
      );
    }

    console.log(
      `Pointed ${planned.length} character holding(s) at catalogue currencies.`
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
