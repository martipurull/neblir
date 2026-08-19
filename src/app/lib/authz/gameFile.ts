import { getGame, userIsInGame } from "@/app/lib/prisma/game";

export async function canReadGameFile(
  file: { gameId: string; access?: "PLAYER" | "GAME_MASTER" | null },
  userId: string
): Promise<boolean> {
  const inGame = await userIsInGame(file.gameId, userId);
  if (!inGame) return false;
  if (file.access !== "GAME_MASTER") return true;
  const game = await getGame(file.gameId);
  return game?.gameMaster === userId;
}
