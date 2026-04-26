import type { Prisma } from "@prisma/client";
import { prisma } from "./client";

export type ReferenceEntryListFilters = {
  category?: "MECHANICS" | "WORLD" | "CAMPAIGN_LORE";
  gameId?: string | null;
};

function referenceEntryDelegate() {
  if (!prisma.referenceEntry) {
    throw new Error(
      "Prisma client is missing the ReferenceEntry delegate. Run `npx prisma generate` and restart the dev server."
    );
  }
  return prisma.referenceEntry;
}

export function getReferenceEntries(filters: ReferenceEntryListFilters = {}) {
  const where: Prisma.ReferenceEntryWhereInput = {
    category: filters.category,
  };

  if (filters.gameId !== undefined) {
    if (filters.gameId === null) {
      where.OR = [{ gameId: null }, { gameId: { isSet: false } }];
    } else {
      where.gameId = filters.gameId;
    }
  }

  return referenceEntryDelegate().findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
}

export function getReferenceEntry(id: string) {
  return referenceEntryDelegate().findUnique({ where: { id } });
}

export function createReferenceEntry(
  data: Prisma.ReferenceEntryUncheckedCreateInput
) {
  return referenceEntryDelegate().create({ data });
}

export function updateReferenceEntry(
  id: string,
  data: Prisma.ReferenceEntryUncheckedUpdateInput
) {
  return referenceEntryDelegate().update({ where: { id }, data });
}

export function deleteReferenceEntry(id: string) {
  return referenceEntryDelegate().delete({ where: { id } });
}
