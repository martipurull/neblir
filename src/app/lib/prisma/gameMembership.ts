import type { InitiativeEntry } from "@prisma/client";
import { prisma } from "./client";
import { updateGame } from "./game";
import { userIsGameMaster } from "./gameCharacter";

function filterInitiativeForCharacterIds(
  order: InitiativeEntry[],
  characterIds: Set<string>
): InitiativeEntry[] {
  if (characterIds.size === 0) return order;
  return order.filter(
    (entry) =>
      !(
        entry.combatantType === "CHARACTER" &&
        characterIds.has(entry.combatantId)
      )
  );
}

export type UnlinkCharacterFromGameResult = {
  removed: boolean;
  removedCount: number;
  characterId: string;
};

/**
 * Unlinks a character from a game and removes their initiative entries.
 */
export async function unlinkCharacterFromGame(
  gameId: string,
  characterId: string
): Promise<UnlinkCharacterFromGameResult> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { initiativeOrder: true },
  });
  if (!game) {
    return { removed: false, removedCount: 0, characterId };
  }

  const deleteResult = await prisma.gameCharacter.deleteMany({
    where: { gameId, characterId },
  });

  if (deleteResult.count > 0) {
    const characterIds = new Set([characterId]);
    const nextInitiative = filterInitiativeForCharacterIds(
      game.initiativeOrder ?? [],
      characterIds
    );
    if (nextInitiative.length !== (game.initiativeOrder ?? []).length) {
      await updateGame(gameId, { initiativeOrder: nextInitiative });
    }
  }

  return {
    removed: deleteResult.count > 0,
    removedCount: deleteResult.count,
    characterId,
  };
}

export type RemovePlayerFromGameResult =
  | { ok: true; removedCharacterIds: string[] }
  | { ok: false; reason: "not_found" | "cannot_remove_gm" | "not_in_game" };

/**
 * Removes a player from a game: membership, their linked characters, invites,
 * initiative entries, and roll history for this game.
 */
export async function removePlayerFromGame(
  gameId: string,
  targetUserId: string
): Promise<RemovePlayerFromGameResult> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { gameMaster: true, initiativeOrder: true },
  });
  if (!game) {
    return { ok: false, reason: "not_found" };
  }

  if (targetUserId === game.gameMaster) {
    return { ok: false, reason: "cannot_remove_gm" };
  }

  const membership = await prisma.gameUser.findFirst({
    where: { gameId, userId: targetUserId },
  });
  if (!membership) {
    return { ok: false, reason: "not_in_game" };
  }

  const ownedLinks = await prisma.characterUser.findMany({
    where: { userId: targetUserId },
    select: { characterId: true },
  });
  const ownedCharacterIds = ownedLinks.map((row) => row.characterId);

  const linkedInGame = await prisma.gameCharacter.findMany({
    where: {
      gameId,
      characterId: { in: ownedCharacterIds },
    },
    select: { characterId: true },
  });
  const removedCharacterIds = linkedInGame.map((row) => row.characterId);
  const characterIdSet = new Set(removedCharacterIds);

  await prisma.$transaction([
    prisma.gameCharacter.deleteMany({
      where: { gameId, characterId: { in: removedCharacterIds } },
    }),
    prisma.gameInvite.deleteMany({
      where: { gameId, invitedUserId: targetUserId },
    }),
    prisma.gameUser.deleteMany({
      where: { gameId, userId: targetUserId },
    }),
    ...(removedCharacterIds.length > 0
      ? [
          prisma.rollEvent.deleteMany({
            where: {
              gameId,
              OR: [
                { rollerUserId: targetUserId },
                { characterId: { in: removedCharacterIds } },
              ],
            },
          }),
        ]
      : [
          prisma.rollEvent.deleteMany({
            where: { gameId, rollerUserId: targetUserId },
          }),
        ]),
  ]);

  const nextInitiative = filterInitiativeForCharacterIds(
    game.initiativeOrder ?? [],
    characterIdSet
  );
  if (nextInitiative.length !== (game.initiativeOrder ?? []).length) {
    await updateGame(gameId, { initiativeOrder: nextInitiative });
  }

  return { ok: true, removedCharacterIds };
}

export async function gameMasterCanUnlinkCharacter(
  gameId: string,
  characterId: string,
  userId: string
): Promise<boolean> {
  if (!(await userIsGameMaster(gameId, userId))) return false;
  const link = await prisma.gameCharacter.findFirst({
    where: { gameId, characterId },
  });
  return !!link;
}
