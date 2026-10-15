import type { Prisma } from "@prisma/client";
import type {
  CurrencyExchangeCommit,
  CurrencyExchangeQuote,
  WalletHolding,
} from "@/app/lib/types/item";
import type {
  NamedWalletEntry,
  ResolvedWalletHolding,
} from "@/app/lib/walletHoldings";
import {
  presentWalletHoldings,
  resolveNamedWalletHoldings,
} from "@/app/lib/walletHoldings";
import { prisma } from "./client";
import { getCurrencies } from "./currency";

export class WalletRuleError extends Error {
  readonly code: "UNKNOWN_CURRENCY" | "INSUFFICIENT_FUNDS";

  constructor(code: "UNKNOWN_CURRENCY" | "INSUFFICIENT_FUNDS") {
    super(code);
    this.name = "WalletRuleError";
    this.code = code;
  }
}

type WalletDb = Prisma.TransactionClient | typeof prisma;

const holdingSelect = {
  currencyId: true,
  quantity: true,
  currency: { select: { name: true, imageKey: true } },
} as const;

async function loadWalletRows(characterId: string, db: WalletDb) {
  return db.characterCurrency.findMany({
    where: { characterId },
    select: holdingSelect,
  });
}

async function requireCatalogueCurrency(db: WalletDb, currencyId: string) {
  const currency = await db.currency.findUnique({
    where: { id: currencyId },
    select: { id: true },
  });
  if (!currency) throw new WalletRuleError("UNKNOWN_CURRENCY");
}

/** Drops a quantity below 1, then points each remaining name at a catalogue row. */
export async function holdingsForNamedWallet(
  entries: readonly NamedWalletEntry[] | null | undefined
): Promise<
  | { ok: true; holdings: ResolvedWalletHolding[] }
  | { ok: false; currencyName: string }
> {
  const named = (entries ?? []).filter((entry) => entry.quantity > 0);
  if (named.length === 0) return { ok: true, holdings: [] };
  return resolveNamedWalletHoldings(named, await getCurrencies());
}

/** Replaces a character's holdings inside an existing transaction. */
export async function writeCharacterWallet(
  db: WalletDb,
  characterId: string,
  entries: readonly ResolvedWalletHolding[]
) {
  const currencyIds = [...new Set(entries.map((entry) => entry.currencyId))];
  if (currencyIds.length > 0) {
    const found = await db.currency.findMany({
      where: { id: { in: currencyIds } },
      select: { id: true },
    });
    if (found.length !== currencyIds.length) {
      throw new WalletRuleError("UNKNOWN_CURRENCY");
    }
  }

  const kept = entries.filter((entry) => entry.quantity > 0);
  await db.characterCurrency.deleteMany({ where: { characterId } });
  if (kept.length > 0) {
    await db.characterCurrency.createMany({
      data: kept.map((entry) => ({
        characterId,
        currencyId: entry.currencyId,
        quantity: entry.quantity,
      })),
    });
  }
}

export async function listCharacterWallet(
  characterId: string
): Promise<WalletHolding[]> {
  return presentWalletHoldings(await loadWalletRows(characterId, prisma));
}

export async function addCharacterCurrency(
  characterId: string,
  currencyId: string,
  amount: number
): Promise<WalletHolding[]> {
  return prisma.$transaction(async (tx) => {
    await requireCatalogueCurrency(tx, currencyId);

    await tx.characterCurrency.upsert({
      where: {
        characterId_currencyId: { characterId, currencyId },
      },
      create: { characterId, currencyId, quantity: amount },
      update: { quantity: { increment: amount } },
    });

    return presentWalletHoldings(await loadWalletRows(characterId, tx));
  });
}

export async function subtractCharacterCurrency(
  characterId: string,
  currencyId: string,
  amount: number
): Promise<WalletHolding[]> {
  return prisma.$transaction(async (tx) => {
    await requireCatalogueCurrency(tx, currencyId);

    const existing = await tx.characterCurrency.findUnique({
      where: {
        characterId_currencyId: { characterId, currencyId },
      },
    });
    if (!existing || existing.quantity < amount) {
      throw new WalletRuleError("INSUFFICIENT_FUNDS");
    }

    if (existing.quantity === amount) {
      await tx.characterCurrency.delete({
        where: {
          characterId_currencyId: { characterId, currencyId },
        },
      });
    } else {
      await tx.characterCurrency.update({
        where: {
          characterId_currencyId: { characterId, currencyId },
        },
        data: { quantity: { decrement: amount } },
      });
    }

    return presentWalletHoldings(await loadWalletRows(characterId, tx));
  });
}

type ExchangeRefusal =
  | { code: "UNKNOWN_CURRENCY" }
  | { code: "INSUFFICIENT_FUNDS" }
  | { code: "SAME_CURRENCY" }
  | {
      code: "NO_WHOLE_UNIT";
      minimumSourceAmount: number;
      sourceName: string;
      destinationName: string;
    };

export class ExchangeRuleError extends Error {
  readonly refusal: ExchangeRefusal;

  constructor(refusal: ExchangeRefusal) {
    super(refusal.code);
    this.name = "ExchangeRuleError";
    this.refusal = refusal;
  }
}

/** Whole destination units the source value covers. Remainder is dropped. */
function wholeDestinationUnits(
  sourceAmount: number,
  sourceExchangeValue: number,
  destinationExchangeValue: number
): number {
  return Number(
    (BigInt(sourceAmount) * BigInt(sourceExchangeValue)) /
      BigInt(destinationExchangeValue)
  );
}

/** Smallest positive source amount that yields one destination unit. */
function minimumSourceForOneUnit(
  sourceExchangeValue: number,
  destinationExchangeValue: number
): number {
  const source = BigInt(sourceExchangeValue);
  const destination = BigInt(destinationExchangeValue);
  return Number((destination + source - BigInt(1)) / source);
}

const exchangeCurrencySelect = {
  id: true,
  name: true,
  exchangeValue: true,
} as const;

type ResolvedCurrencyExchange = CurrencyExchangeQuote & {
  sourceQuantity: number;
};

function exchangeQuote(
  resolved: ResolvedCurrencyExchange
): CurrencyExchangeQuote {
  return {
    sourceExchangeValue: resolved.sourceExchangeValue,
    destinationExchangeValue: resolved.destinationExchangeValue,
    destinationQuantity: resolved.destinationQuantity,
  };
}

async function resolveCurrencyExchange(
  db: WalletDb,
  characterId: string,
  sourceCurrencyId: string,
  destinationCurrencyId: string,
  amount: number
): Promise<ResolvedCurrencyExchange> {
  const source = await db.currency.findUnique({
    where: { id: sourceCurrencyId },
    select: exchangeCurrencySelect,
  });
  const destination = await db.currency.findUnique({
    where: { id: destinationCurrencyId },
    select: exchangeCurrencySelect,
  });
  if (!source || !destination) {
    throw new ExchangeRuleError({ code: "UNKNOWN_CURRENCY" });
  }
  if (source.id === destination.id) {
    throw new ExchangeRuleError({ code: "SAME_CURRENCY" });
  }

  const holding = await db.characterCurrency.findUnique({
    where: {
      characterId_currencyId: { characterId, currencyId: sourceCurrencyId },
    },
  });
  if (!holding || holding.quantity < amount) {
    throw new ExchangeRuleError({ code: "INSUFFICIENT_FUNDS" });
  }

  const destinationQuantity = wholeDestinationUnits(
    amount,
    source.exchangeValue,
    destination.exchangeValue
  );
  if (destinationQuantity < 1) {
    throw new ExchangeRuleError({
      code: "NO_WHOLE_UNIT",
      minimumSourceAmount: minimumSourceForOneUnit(
        source.exchangeValue,
        destination.exchangeValue
      ),
      sourceName: source.name,
      destinationName: destination.name,
    });
  }

  return {
    sourceExchangeValue: source.exchangeValue,
    destinationExchangeValue: destination.exchangeValue,
    destinationQuantity,
    sourceQuantity: holding.quantity,
  };
}

export async function quoteCharacterCurrencyExchange(
  characterId: string,
  sourceCurrencyId: string,
  destinationCurrencyId: string,
  amount: number
): Promise<CurrencyExchangeQuote> {
  return exchangeQuote(
    await resolveCurrencyExchange(
      prisma,
      characterId,
      sourceCurrencyId,
      destinationCurrencyId,
      amount
    )
  );
}

export async function commitCharacterCurrencyExchange(
  characterId: string,
  sourceCurrencyId: string,
  destinationCurrencyId: string,
  amount: number
): Promise<CurrencyExchangeCommit> {
  return prisma.$transaction(async (tx) => {
    const resolved = await resolveCurrencyExchange(
      tx,
      characterId,
      sourceCurrencyId,
      destinationCurrencyId,
      amount
    );

    if (resolved.sourceQuantity === amount) {
      await tx.characterCurrency.delete({
        where: {
          characterId_currencyId: { characterId, currencyId: sourceCurrencyId },
        },
      });
    } else {
      await tx.characterCurrency.update({
        where: {
          characterId_currencyId: { characterId, currencyId: sourceCurrencyId },
        },
        data: { quantity: { decrement: amount } },
      });
    }

    await tx.characterCurrency.upsert({
      where: {
        characterId_currencyId: {
          characterId,
          currencyId: destinationCurrencyId,
        },
      },
      create: {
        characterId,
        currencyId: destinationCurrencyId,
        quantity: resolved.destinationQuantity,
      },
      update: { quantity: { increment: resolved.destinationQuantity } },
    });

    return {
      ...exchangeQuote(resolved),
      wallet: presentWalletHoldings(await loadWalletRows(characterId, tx)),
    };
  });
}

export async function replaceCharacterWallet(
  characterId: string,
  entries: readonly ResolvedWalletHolding[]
): Promise<WalletHolding[]> {
  return prisma.$transaction(async (tx) => {
    await writeCharacterWallet(tx, characterId, entries);
    return presentWalletHoldings(await loadWalletRows(characterId, tx));
  });
}
