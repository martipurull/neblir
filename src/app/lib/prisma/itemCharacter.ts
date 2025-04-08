import { Prisma } from "@prisma/client";
import { prisma } from "./client";

export async function createItemCharacter(data: Prisma.ItemCharacterUncheckedCreateInput) {
    return prisma.itemCharacter.create({ data });
}

export async function deleteItemCharacter(id: string) {
    return prisma.itemCharacter.delete({ where: { id } });
}