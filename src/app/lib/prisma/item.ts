import type { z } from "zod";
import {
  mapItemUpdateParsedToPrisma,
  mapParsedItemToPrismaCreate,
  mapPrismaItemToApi,
} from "@/app/lib/itemModifierPrisma";
import type { Item as ParsedItem } from "@/app/lib/types/item";
import type { itemUpdateSchema } from "@/app/lib/types/item";
import { prisma } from "./client";

type ItemUpdateParsed = z.infer<typeof itemUpdateSchema>;

export async function createItem(data: ParsedItem) {
  const row = await prisma.item.create({
    data: mapParsedItemToPrismaCreate(data),
  });
  return mapPrismaItemToApi(row);
}

export async function getItem(id: string) {
  const row = await prisma.item.findUnique({ where: { id } });
  return row ? mapPrismaItemToApi(row) : null;
}

export async function getItems() {
  const rows = await prisma.item.findMany();
  return rows.map(mapPrismaItemToApi);
}

export async function updateItem(id: string, data: ItemUpdateParsed) {
  const row = await prisma.item.update({
    where: { id },
    data: mapItemUpdateParsedToPrisma(data),
  });
  return mapPrismaItemToApi(row);
}

export async function deleteItem(id: string) {
  return prisma.item.delete({ where: { id } });
}
