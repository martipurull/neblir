import { Prisma } from "@prisma/client";
import { prisma } from "./client";


export async function createCharacterUser(data: Prisma.CharacterUserUncheckedCreateInput) {
    return prisma.characterUser.create({ data });
}

export async function deleteCharacterUser(id: string) {
    return prisma.characterUser.delete({ where: { id } });
}

export async function deleteCharacterUserByCharacterId(characterId: string) {
    return prisma.characterUser.deleteMany({ where: { characterId } })
}