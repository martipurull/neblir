import { resolveStashRename, type StashRename } from "@/app/lib/stashPlace";
import { prisma } from "./client";

export type RenameStashResult =
  | { ok: true; placeName: string }
  | { ok: false; reason: "unauthorised" }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "missing" }
  | { ok: false; reason: "invalid"; message: string };

/**
 * Play control of at least one character linked to this game:
 * the game master, an owner of a linked character, or a play-grant holder.
 */
async function callerHasPlayControlInGame(
  gameId: string,
  requesterId: string,
  gameMaster: string
): Promise<boolean> {
  if (gameMaster === requesterId) {
    const link = await prisma.gameCharacter.findFirst({
      where: { gameId },
      select: { id: true },
    });
    return link !== null;
  }

  const link = await prisma.gameCharacter.findFirst({
    where: {
      gameId,
      OR: [
        { character: { users: { some: { userId: requesterId } } } },
        { playGrantUserId: requesterId },
      ],
    },
    select: { id: true },
  });
  return link !== null;
}

/** Rename one stash on this game. Other games, and places with no game, are not loaded. */
export async function renameStash(
  gameId: string,
  requesterId: string,
  rename: StashRename
): Promise<RenameStashResult> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { gameMaster: true },
  });
  if (!game) return { ok: false, reason: "not_found" };

  const allowed = await callerHasPlayControlInGame(
    gameId,
    requesterId,
    game.gameMaster
  );
  if (!allowed) return { ok: false, reason: "unauthorised" };

  const holdings = await prisma.itemCharacter.findMany({
    where: { stashGameId: gameId },
    select: { id: true, itemLocation: true, stashGameId: true },
    orderBy: { id: "asc" },
  });
  const resolved = resolveStashRename(holdings, gameId, rename);
  if (!resolved.ok) {
    if (resolved.reason === "missing") return { ok: false, reason: "missing" };
    return { ok: false, reason: "invalid", message: resolved.message };
  }

  await prisma.itemCharacter.updateMany({
    where: { id: { in: resolved.holdingIds } },
    data: { itemLocation: resolved.placeName },
  });
  return { ok: true, placeName: resolved.placeName };
}
