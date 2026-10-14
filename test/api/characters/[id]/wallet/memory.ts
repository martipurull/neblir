import { vi, type Mock } from "vitest";

type WalletCurrencyRow = {
  id: string;
  name: string;
  imageKey: string;
  exchangeValue: number;
};

export type WalletHoldingRow = {
  characterId: string;
  currencyId: string;
  quantity: number;
};

type WalletPrismaDouble = {
  currency: { findUnique: Mock; findMany: Mock };
  characterCurrency: {
    findMany: Mock;
    findUnique: Mock;
    upsert: Mock;
    update: Mock;
    delete: Mock;
    deleteMany: Mock;
    createMany: Mock;
    count: Mock;
  };
  $transaction: Mock;
};

export type WalletMemory = {
  currencies: Map<string, WalletCurrencyRow>;
  holdings: WalletHoldingRow[];
  reset: () => void;
  seedCurrency: (row: WalletCurrencyRow) => void;
  seedHolding: (row: WalletHoldingRow) => void;
};

export function createWalletMemory(): WalletMemory {
  const currencies = new Map<string, WalletCurrencyRow>();
  const holdings: WalletHoldingRow[] = [];
  return {
    currencies,
    holdings,
    reset() {
      currencies.clear();
      holdings.splice(0, holdings.length);
    },
    seedCurrency(row) {
      currencies.set(row.id, row);
    },
    seedHolding(row) {
      holdings.push({ ...row });
    },
  };
}

export function createWalletPrismaDouble(): WalletPrismaDouble {
  return {
    currency: { findUnique: vi.fn(), findMany: vi.fn() },
    characterCurrency: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

function findHolding(
  holdings: WalletHoldingRow[],
  characterId: string,
  currencyId: string
) {
  return holdings.find(
    (holding) =>
      holding.characterId === characterId && holding.currencyId === currencyId
  );
}

export function bindWalletMemory(
  prisma: WalletPrismaDouble,
  memory: WalletMemory
) {
  prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
    fn(prisma)
  );
  prisma.currency.findUnique.mockImplementation(
    async ({ where }: { where: { id: string } }) =>
      memory.currencies.get(where.id) ?? null
  );
  prisma.currency.findMany.mockImplementation(
    async (args?: { where?: { id?: { in?: string[] } } }) => {
      const ids = args?.where?.id?.in;
      const rows = [...memory.currencies.values()];
      if (!ids) return rows;
      return rows.filter((row) => ids.includes(row.id));
    }
  );
  prisma.characterCurrency.findMany.mockImplementation(
    async (args: { where: { characterId: string } }) =>
      memory.holdings
        .filter((holding) => holding.characterId === args.where.characterId)
        .map((holding) => ({
          currencyId: holding.currencyId,
          quantity: holding.quantity,
          currency: memory.currencies.get(holding.currencyId) ?? null,
        }))
  );
  prisma.characterCurrency.findUnique.mockImplementation(
    async ({
      where,
    }: {
      where: {
        characterId_currencyId: { characterId: string; currencyId: string };
      };
    }) => {
      const { characterId, currencyId } = where.characterId_currencyId;
      return findHolding(memory.holdings, characterId, currencyId) ?? null;
    }
  );
  prisma.characterCurrency.upsert.mockImplementation(
    async (args: {
      where: {
        characterId_currencyId: { characterId: string; currencyId: string };
      };
      create: WalletHoldingRow;
      update: { quantity: { increment: number } };
    }) => {
      const { characterId, currencyId } = args.where.characterId_currencyId;
      const existing = findHolding(memory.holdings, characterId, currencyId);
      if (!existing) {
        memory.holdings.push({ ...args.create });
        return args.create;
      }
      existing.quantity += args.update.quantity.increment;
      return existing;
    }
  );
  prisma.characterCurrency.update.mockImplementation(
    async (args: {
      where: {
        characterId_currencyId: { characterId: string; currencyId: string };
      };
      data: { quantity: { decrement: number } };
    }) => {
      const { characterId, currencyId } = args.where.characterId_currencyId;
      const existing = findHolding(memory.holdings, characterId, currencyId);
      if (!existing) throw new Error("holding missing");
      existing.quantity -= args.data.quantity.decrement;
      return existing;
    }
  );
  prisma.characterCurrency.delete.mockImplementation(
    async ({
      where,
    }: {
      where: {
        characterId_currencyId: { characterId: string; currencyId: string };
      };
    }) => {
      const { characterId, currencyId } = where.characterId_currencyId;
      const index = memory.holdings.findIndex(
        (holding) =>
          holding.characterId === characterId &&
          holding.currencyId === currencyId
      );
      if (index < 0) throw new Error("holding missing");
      const [removed] = memory.holdings.splice(index, 1);
      return removed;
    }
  );
  prisma.characterCurrency.deleteMany.mockImplementation(
    async (args: { where: { characterId: string } }) => {
      const before = memory.holdings.length;
      for (let index = memory.holdings.length - 1; index >= 0; index -= 1) {
        if (memory.holdings[index]?.characterId === args.where.characterId) {
          memory.holdings.splice(index, 1);
        }
      }
      return { count: before - memory.holdings.length };
    }
  );
  prisma.characterCurrency.createMany.mockImplementation(
    async (args: { data: WalletHoldingRow[] }) => {
      for (const row of args.data) memory.holdings.push({ ...row });
      return { count: args.data.length };
    }
  );
  prisma.characterCurrency.count.mockImplementation(
    async (args: { where: { currencyId: string } }) =>
      memory.holdings.filter(
        (holding) => holding.currencyId === args.where.currencyId
      ).length
  );
}
