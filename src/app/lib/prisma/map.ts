import type { Prisma } from "@prisma/client";
import { prisma } from "./client";

export type MapListFilters = {
  gameId?: string | null;
};

function mapDelegate() {
  if (!prisma.map) {
    throw new Error(
      "Prisma client is missing the Map delegate. Run `npx prisma generate` and restart the dev server."
    );
  }
  return prisma.map;
}

export function getMaps(filters: MapListFilters = {}) {
  const where: Prisma.MapWhereInput = {};

  if (filters.gameId !== undefined) {
    if (filters.gameId === null) {
      where.OR = [{ gameId: null }, { gameId: { isSet: false } }];
    } else {
      where.gameId = filters.gameId;
    }
  }

  return mapDelegate().findMany({
    where,
    orderBy: [{ name: "asc" }],
  });
}

export function getMap(id: string) {
  return mapDelegate().findUnique({ where: { id } });
}

export function createMap(data: Prisma.MapUncheckedCreateInput) {
  return mapDelegate().create({ data });
}

export function updateMap(id: string, data: Prisma.MapUncheckedUpdateInput) {
  return mapDelegate().update({ where: { id }, data });
}

export function deleteMap(id: string) {
  return mapDelegate().delete({ where: { id } });
}
