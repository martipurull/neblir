import type { Prisma } from "@prisma/client";
import type {
  ResolvedWalletHolding,
  WalletHoldingView,
} from "@/app/lib/walletHoldings";
import { presentWalletHoldings } from "@/app/lib/walletHoldings";
import { prisma } from "./client";

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

export async function listCharacterWallet(
  characterId: string
): Promise<WalletHoldingView[]> {
  return presentWalletHoldings(await loadWalletRows(characterId, prisma));
}

export async function countCurrencyHoldings(currencyId: string) {
  return prisma.characterCurrency.count({ where: { currencyId } });
}

export async function addCharacterCurrency(
  characterId: string,
  currencyId: string,
  amount: number
): Promise<WalletHoldingView[]> {
  return prisma.$transaction(async (tx) => {
    const currency = await tx.currency.findUnique({
      where: { id: currencyId },
      select: { id: true },
    });
    if (!currency) throw new WalletRuleError("UNKNOWN_CURRENCY");

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
): Promise<WalletHoldingView[]> {
  return prisma.$transaction(async (tx) => {
    const currency = await tx.currency.findUnique({
      where: { id: currencyId },
      select: { id: true },
    });
    if (!currency) throw new WalletRuleError("UNKNOWN_CURRENCY");

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
): Promise<WalletHoldingView[]> {
  const kept = entries.filter((entry) => entry.quantity > 0);
  return prisma.$transaction(async (tx) => {
    const currencyIds = [...new Set(kept.map((entry) => entry.currencyId))];
    if (currencyIds.length > 0) {
      const found = await tx.currency.findMany({
        where: { id: { in: currencyIds } },
        select: { id: true },
      });
      if (found.length !== currencyIds.length) {
        throw new WalletRuleError("UNKNOWN_CURRENCY");
      }
    }

    await tx.characterCurrency.deleteMany({ where: { characterId } });
    if (kept.length > 0) {
      await tx.characterCurrency.createMany({
        data: kept.map((entry) => ({
          characterId,
          currencyId: entry.currencyId,
          quantity: entry.quantity,
        })),
      });
    }

    return presentWalletHoldings(await loadWalletRows(characterId, tx));
  });
}
