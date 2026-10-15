import type { Prisma } from "@prisma/client";
import type { WalletHolding } from "@/app/lib/types/item";
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

export async function replaceCharacterWallet(
  characterId: string,
  entries: readonly ResolvedWalletHolding[]
): Promise<WalletHolding[]> {
  return prisma.$transaction(async (tx) => {
    await writeCharacterWallet(tx, characterId, entries);
    return presentWalletHoldings(await loadWalletRows(characterId, tx));
  });
}
