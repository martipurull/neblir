import type { Prisma } from "@prisma/client";
import { prisma } from "./client";

const officialMapImageWhere = (imageKey: string): Prisma.MapWhereInput => ({
  imageKey,
  OR: [{ gameId: null }, { gameId: { isSet: false } }],
});

export async function countOfficialRowsWithCatalogueImageKey(
  imageKey: string
): Promise<number> {
  const [items, vehicles, enemies, maps] = await Promise.all([
    prisma.item.count({ where: { imageKey } }),
    prisma.vehicle.count({ where: { imageKey } }),
    prisma.enemy.count({ where: { imageKey } }),
    prisma.map.count({ where: officialMapImageWhere(imageKey) }),
  ]);
  return items + vehicles + enemies + maps;
}
