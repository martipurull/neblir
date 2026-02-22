import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

type LegacyWalletEntry = {
  currencyName?: string;
  quantity?: number;
};

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  const pruneOldField = process.argv.includes("--prune-old");

  const client = new MongoClient(mongoUri);
  await client.connect();

  try {
    const db = client.db("neblir-dev");
    const characters = db.collection("Character");
    const characterCurrencies = db.collection("CharacterCurrency");

    const docs = await characters
      .find<{ _id: ObjectId; wallet?: LegacyWalletEntry[] }>({
        wallet: { $exists: true, $ne: [] },
      })
      .toArray();

    let migratedRows = 0;

    for (const doc of docs) {
      const wallet = Array.isArray(doc.wallet) ? doc.wallet : [];
      if (!wallet.length) continue;

      // Merge duplicates in legacy wallet by summing quantities.
      const merged = new Map<string, number>();
      for (const entry of wallet) {
        if (!entry?.currencyName) continue;
        const quantity = Number(entry.quantity ?? 0);
        merged.set(
          entry.currencyName,
          (merged.get(entry.currencyName) ?? 0) + Math.max(0, quantity)
        );
      }

      for (const [currencyName, quantity] of merged) {
        await characterCurrencies.updateOne(
          { characterId: doc._id, currencyName },
          {
            $set: {
              characterId: doc._id,
              currencyName,
              quantity,
            },
          },
          { upsert: true }
        );
        migratedRows++;
      }
    }

    if (pruneOldField) {
      await characters.updateMany(
        { wallet: { $exists: true } },
        { $unset: { wallet: "" } }
      );
    }

    console.log(
      `Migrated ${migratedRows} character currency rows from legacy wallet field.`
    );
    if (pruneOldField) {
      console.log("Legacy Character.wallet field removed from documents.");
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
