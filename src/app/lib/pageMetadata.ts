import { characterBelongsToUser } from "@/app/lib/prisma/characterUser";
import { prisma } from "@/app/lib/prisma/client";
import { userIsInGame } from "@/app/lib/prisma/game";
import { gameMasterCanViewGameCharacter } from "@/app/lib/prisma/gameCharacter";
import {
  formatCharacterDisplayName,
  resolveEntityPageTitle,
} from "@/app/lib/pageTitle";
import { auth } from "@/auth";

async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function characterDisplayTitle(characterId: string): Promise<string> {
  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { generalInformation: true },
  });
  return resolveEntityPageTitle(
    formatCharacterDisplayName(
      character?.generalInformation.name,
      character?.generalInformation.surname
    ),
    "Character"
  );
}

export async function resolveGamePageTitle(gameId: string): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId || !(await userIsInGame(gameId, userId))) {
    return "Game";
  }
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { name: true },
  });
  return resolveEntityPageTitle(game?.name, "Game");
}

export async function resolveOwnedCharacterPageTitle(
  characterId: string
): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId || !(await characterBelongsToUser(characterId, userId))) {
    return "Character";
  }
  return characterDisplayTitle(characterId);
}

export async function resolveGameCharacterPageTitle(
  gameId: string,
  characterId: string
): Promise<string> {
  const userId = await getSessionUserId();
  if (
    !userId ||
    !(await gameMasterCanViewGameCharacter(gameId, characterId, userId))
  ) {
    return "Character";
  }
  return characterDisplayTitle(characterId);
}

export async function resolveEnemyInstancePageTitle(
  gameId: string,
  instanceId: string
): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) return "Enemy";

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { gameMaster: true },
  });
  if (!game) return "Enemy";

  const isGm = game.gameMaster === userId;
  if (!isGm && !(await userIsInGame(gameId, userId))) {
    return "Enemy";
  }

  const row = await prisma.enemyInstance.findFirst({
    where: { id: instanceId, gameId },
    select: { name: true, isPublic: true },
  });
  if (!row) return "Enemy";
  if (row.isPublic === false && !isGm) return "Enemy";
  return resolveEntityPageTitle(row.name, "Enemy");
}
