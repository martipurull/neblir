import { isGmControlledFromOwnerIds } from "@/app/lib/gmUtils";
import { npcGroupNameToStore, resolveNpcGroupRename } from "@/app/lib/npcList";
import { prisma } from "./client";

export type SetNpcGroupResult =
  | { ok: true; npcGroup: string | null }
  | {
      ok: false;
      reason: "unauthorised" | "not_found" | "not_linked" | "player_character";
    };

export async function setNpcGroup(
  gameId: string,
  characterId: string,
  requesterId: string,
  npcGroup: string | null
): Promise<SetNpcGroupResult> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { gameMaster: true },
  });
  if (!game) return { ok: false, reason: "not_found" };
  if (game.gameMaster !== requesterId) {
    return { ok: false, reason: "unauthorised" };
  }

  const link = await prisma.gameCharacter.findFirst({
    where: { gameId, characterId },
    select: { id: true },
  });
  if (!link) return { ok: false, reason: "not_linked" };

  const [members, owners] = await Promise.all([
    prisma.gameUser.findMany({
      where: { gameId },
      select: { userId: true },
    }),
    prisma.characterUser.findMany({
      where: { characterId },
      select: { userId: true },
    }),
  ]);
  const gmControlled = isGmControlledFromOwnerIds(
    owners.map((row) => row.userId),
    new Set(members.map((row) => row.userId)),
    game.gameMaster
  );
  if (!gmControlled) return { ok: false, reason: "player_character" };

  const stored = await storedNpcGroupName(gameId, npcGroup);
  await prisma.gameCharacter.update({
    where: { id: link.id },
    data: { npcGroup: stored },
  });
  return { ok: true, npcGroup: stored };
}

/** Blank and the word Ungrouped store no name. A match keeps the first spelling. */
async function storedNpcGroupName(
  gameId: string,
  candidate: string | null
): Promise<string | null> {
  if (npcGroupNameToStore(candidate, []) === null) return null;

  const existing = await prisma.gameCharacter.findMany({
    where: { gameId, npcGroup: { not: null } },
    select: { npcGroup: true },
    orderBy: { id: "asc" },
  });
  const spellings = existing.flatMap((row) =>
    row.npcGroup ? [row.npcGroup] : []
  );
  return npcGroupNameToStore(candidate, spellings);
}

export type RenameNpcGroupResult =
  | { ok: true; npcGroup: string }
  | {
      ok: false;
      reason:
        | "unauthorised"
        | "not_found"
        | "missing"
        | "not_a_group"
        | "ungrouped"
        | "reserved";
    };

/** One update for every link on this game whose name matches `from`. */
export async function renameNpcGroup(
  gameId: string,
  requesterId: string,
  from: string,
  npcGroup: string
): Promise<RenameNpcGroupResult> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { gameMaster: true },
  });
  if (!game) return { ok: false, reason: "not_found" };
  if (game.gameMaster !== requesterId) {
    return { ok: false, reason: "unauthorised" };
  }

  const links = await prisma.gameCharacter.findMany({
    where: { gameId, npcGroup: { not: null } },
    select: { id: true, npcGroup: true },
    orderBy: { id: "asc" },
  });
  const resolved = resolveNpcGroupRename(links, from, npcGroup);
  if (!resolved.ok) return { ok: false, reason: resolved.reason };

  await prisma.gameCharacter.updateMany({
    where: { id: { in: resolved.linkIds } },
    data: { npcGroup: resolved.npcGroup },
  });
  return { ok: true, npcGroup: resolved.npcGroup };
}
