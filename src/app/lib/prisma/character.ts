import { prisma } from "./client";
import { Prisma } from "@prisma/client";

export async function createCharacter(data: Prisma.CharacterCreateInput) {
  return prisma.character.create({ data });
}

export async function getCharacter(id: string) {
  console.log(`Trying to fetch character with id ${id}.`)
  return prisma.character.findUnique({
    where: { id },
    include: {
      inventory: { include: { item: true } },
      paths: { include: { path: true } },
      features: { include: { feature: true } },
    },
  });
}

export async function updateCharacter(
  id: string,
  data: Prisma.CharacterUpdateInput
) {
  return prisma.character.update({ where: { id }, data });
}

export async function deleteCharacter(id: string) {
  return prisma.character.delete({ where: { id } });
}
