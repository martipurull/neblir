import { prisma } from "./client";

export async function characterBelongsToUser(
  characterId: string,
  userId: string
) {
  const characterUser = await prisma.characterUser.findFirst({
    where: { characterId, userId },
  });
  return !!characterUser;
}
