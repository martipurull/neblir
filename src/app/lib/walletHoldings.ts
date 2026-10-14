import { orderConfFirstThenByName } from "@/app/lib/currencyOrder";

export type NamedWalletEntry = {
  currencyName: string;
  quantity: number;
};

export type ResolvedWalletHolding = {
  currencyId: string;
  quantity: number;
};

export type WalletHoldingView = {
  currencyId: string;
  name: string;
  imageKey: string;
  quantity: number;
};

type CatalogueName = {
  id: string;
  name: string;
};

type StoredHolding = {
  currencyId: string;
  quantity: number;
  currency: { name: string; imageKey: string } | null;
};

/** Points starting holdings at catalogue rows. A quantity below 1 is dropped. */
export function resolveNamedWalletHoldings(
  entries: readonly NamedWalletEntry[],
  currencies: readonly CatalogueName[]
):
  | { ok: true; holdings: ResolvedWalletHolding[] }
  | { ok: false; currencyName: string } {
  const idByName = new Map(
    currencies.map((currency) => [currency.name, currency.id])
  );
  const holdings: ResolvedWalletHolding[] = [];
  for (const entry of entries) {
    if (entry.quantity <= 0) continue;
    const currencyId = idByName.get(entry.currencyName);
    if (!currencyId) return { ok: false, currencyName: entry.currencyName };
    holdings.push({ currencyId, quantity: entry.quantity });
  }
  return { ok: true, holdings };
}

/** Image, quantity, and current name. Omits exchange value and zero quantities. */
export function presentWalletHoldings(
  rows: readonly StoredHolding[]
): WalletHoldingView[] {
  const visible: WalletHoldingView[] = [];
  for (const row of rows) {
    if (!row.currency || row.quantity < 1) continue;
    visible.push({
      currencyId: row.currencyId,
      name: row.currency.name,
      imageKey: row.currency.imageKey,
      quantity: row.quantity,
    });
  }
  return orderConfFirstThenByName(visible);
}
