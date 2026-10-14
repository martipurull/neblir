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
