import { isGmControlledFromOwnerIds } from "@/app/lib/gmUtils";
import { prisma } from "./client";

export type PlayGrantMutationResult =
  | { ok: true; playGrantUserId: string | null }
  | {
      ok: false;
      reason:
        | "unauthorised"
        | "not_found"
        | "not_linked"
        | "not_gm_controlled"
        | "invalid_grantee";
    };

async function loadGameMaster(gameId: string): Promise<string | null> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { gameMaster: true },
  });
  return game?.gameMaster ?? null;
}

async function characterIsGmControlledInGame(
  gameId: string,
  characterId: string,
  gameMaster: string
): Promise<boolean> {
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
  return isGmControlledFromOwnerIds(
    owners.map((row) => row.userId),
    new Set(members.map((row) => row.userId)),
    gameMaster
  );
}

export async function issuePlayGrant(
  gameId: string,
  characterId: string,
  requesterId: string,
  granteeUserId: string
): Promise<PlayGrantMutationResult> {
  const gameMaster = await loadGameMaster(gameId);
  if (gameMaster == null) return { ok: false, reason: "not_found" };
  if (gameMaster !== requesterId) return { ok: false, reason: "unauthorised" };

  const link = await prisma.gameCharacter.findFirst({
    where: { gameId, characterId },
    select: { id: true, playGrantUserId: true },
  });
  if (!link) return { ok: false, reason: "not_linked" };

  if (!(await characterIsGmControlledInGame(gameId, characterId, gameMaster))) {
    return { ok: false, reason: "not_gm_controlled" };
  }

  if (granteeUserId === gameMaster) {
    return { ok: false, reason: "invalid_grantee" };
  }

  const members = await prisma.gameUser.findMany({
    where: { gameId },
    select: { userId: true },
  });
  if (!members.some((row) => row.userId === granteeUserId)) {
    return { ok: false, reason: "invalid_grantee" };
  }

  await prisma.gameCharacter.update({
    where: { id: link.id },
    data: { playGrantUserId: granteeUserId },
  });
  return { ok: true, playGrantUserId: granteeUserId };
}

export async function revokePlayGrant(
  gameId: string,
  characterId: string,
  requesterId: string
): Promise<PlayGrantMutationResult> {
  const gameMaster = await loadGameMaster(gameId);
  if (gameMaster == null) return { ok: false, reason: "not_found" };
  if (gameMaster !== requesterId) return { ok: false, reason: "unauthorised" };

  const link = await prisma.gameCharacter.findFirst({
    where: { gameId, characterId },
    select: { id: true },
  });
  if (!link) return { ok: false, reason: "not_linked" };

  if (!(await characterIsGmControlledInGame(gameId, characterId, gameMaster))) {
    return { ok: false, reason: "not_gm_controlled" };
  }

  await prisma.gameCharacter.update({
    where: { id: link.id },
    data: { playGrantUserId: null },
  });
  return { ok: true, playGrantUserId: null };
}
