import { getGame, userIsInGame } from "@/app/lib/prisma/game";

export async function canReadReferenceEntry(
  entry: { gameId: string | null; access: "PLAYER" | "GAME_MASTER" },
  userId: string
): Promise<boolean> {
  if (!entry.gameId) return entry.access === "PLAYER";

  const inGame = await userIsInGame(entry.gameId, userId);
  if (!inGame) return false;

  if (entry.access === "PLAYER") return true;
  const game = await getGame(entry.gameId);
  return game?.gameMaster === userId;
}

export async function canWriteGameScopedReferenceEntry(
  entry: { gameId: string | null },
  userId: string
): Promise<boolean> {
  if (!entry.gameId) return false;

  const game = await getGame(entry.gameId);
  return game?.gameMaster === userId;
}
