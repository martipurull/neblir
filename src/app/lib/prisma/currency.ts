import { prisma } from "./client";

function currencyDelegate() {
  if (!prisma.currency) {
    throw new Error(
      "Prisma client is missing the Currency delegate. Run `npx prisma generate` and restart the dev server."
    );
  }
  return prisma.currency;
}

export function getCurrencies() {
  return currencyDelegate().findMany();
}

export function getCurrency(id: string) {
  return currencyDelegate().findUnique({ where: { id } });
}

export function createCurrency(data: {
  name: string;
  exchangeValue: number;
  imageKey: string;
  protectedFromOfficialImport: boolean;
}) {
  return currencyDelegate().create({ data });
}

export function updateCurrency(
  id: string,
  data: {
    name?: string;
    exchangeValue?: number;
    imageKey?: string;
    protectedFromOfficialImport?: boolean;
  }
) {
  return currencyDelegate().update({ where: { id }, data });
}

export function deleteCurrency(id: string) {
  return currencyDelegate().delete({ where: { id } });
}
