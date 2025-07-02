import { Prisma } from "@prisma/client";
import { prisma } from "./client";

export async function createItemCharacter(data: Prisma.ItemCharacterUncheckedCreateInput) {
    return prisma.itemCharacter.create({ data });
}

export async function getCharacterEquipment(characterId: string) {
    return prisma.itemCharacter.findMany({ where: { characterId } })
}

export async function deleteItemCharacter(id: string) {
    return prisma.itemCharacter.delete({ where: { id } });
}

export async function deleteCharacterEquipment(characterId: string) {
    return prisma.itemCharacter.deleteMany({ where: { characterId } })
}