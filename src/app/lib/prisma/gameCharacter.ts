import { prisma } from "./client";

export async function characterIsInGame(
  gameId: string,
  characterId: string
): Promise<boolean> {
  const gc = await prisma.gameCharacter.findFirst({
    where: { gameId, characterId },
  });
  return !!gc;
}

/** True when the user is the game master of `gameId`. */
export async function userIsGameMaster(
  gameId: string,
  userId: string
): Promise<boolean> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { gameMaster: true },
  });
  return game?.gameMaster === userId;
}

/**
 * GM read access: caller must GM the game and the character must be linked to it.
 */
export async function gameMasterCanViewGameCharacter(
  gameId: string,
  characterId: string,
  userId: string
): Promise<boolean> {
  if (!(await userIsGameMaster(gameId, userId))) return false;
  return characterIsInGame(gameId, characterId);
}

export async function userOwnsCharacter(
  characterId: string,
  userId: string
): Promise<boolean> {
  const row = await prisma.characterUser.findFirst({
    where: { characterId, userId },
  });
  return !!row;
}

/** Game ids where both characters are linked. */
async function getSharedGameIdsBetweenCharacters(
  characterIdA: string,
  characterIdB: string
): Promise<string[]> {
  const aRows = await prisma.gameCharacter.findMany({
    where: { characterId: characterIdA },
    select: { gameId: true },
  });
  const gameIds = aRows.map((row) => row.gameId);
  if (gameIds.length === 0) return [];
  const bRows = await prisma.gameCharacter.findMany({
    where: { characterId: characterIdB, gameId: { in: gameIds } },
    select: { gameId: true },
  });
  return bRows.map((row) => row.gameId);
}

/**
 * Whether the viewer may see / interact with a character link in a game (e.g. give item).
 */
async function viewerCanSeeCharacterInGame(
  gameId: string,
  characterId: string,
  viewerUserId: string
): Promise<boolean> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { gameMaster: true },
  });
  if (!game) return false;
  if (game.gameMaster === viewerUserId) return true;

  const link = await prisma.gameCharacter.findFirst({
    where: { gameId, characterId },
    select: { isPublic: true },
  });
  if (!link) return false;

  if (await userOwnsCharacter(characterId, viewerUserId)) return true;
  return link.isPublic !== false;
}

/** Whether `viewerUserId` may give an item from `fromCharacterId` to `toCharacterId`. */
export async function viewerCanGiveItemToRecipient(
  viewerUserId: string,
  fromCharacterId: string,
  toCharacterId: string,
  options?: { restrictGameId?: string | null }
): Promise<boolean> {
  if (fromCharacterId === toCharacterId) return false;

  const gameIds = options?.restrictGameId
    ? [options.restrictGameId]
    : await getSharedGameIdsBetweenCharacters(fromCharacterId, toCharacterId);

  for (const gameId of gameIds) {
    if (!(await characterIsInGame(gameId, toCharacterId))) continue;
    if (
      await viewerCanSeeCharacterInGame(gameId, toCharacterId, viewerUserId)
    ) {
      return true;
    }
  }
  return false;
}

/** True when both characters are registered in at least one shared game. */
export async function charactersShareAnyGame(
  characterIdA: string,
  characterIdB: string
): Promise<boolean> {
  const rows = await prisma.gameCharacter.findMany({
    where: { characterId: characterIdA },
    select: { gameId: true },
  });
  if (rows.length === 0) return false;
  const shared = await prisma.gameCharacter.findFirst({
    where: {
      characterId: characterIdB,
      gameId: { in: rows.map((r) => r.gameId) },
    },
  });
  return !!shared;
}
