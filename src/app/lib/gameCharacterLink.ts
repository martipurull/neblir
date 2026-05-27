import { prisma } from "@/app/lib/prisma/client";
import { userIsInGame } from "@/app/lib/prisma/game";

export class GameCharacterLinkError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GameCharacterLinkError";
    this.status = status;
  }
}

/**
 * Validates that the user may link a newly created character to a game.
 * Mirrors visibility rules from POST /api/games/[id]/characters.
 */
export async function resolveGameCharacterLinkForCreate(
  gameId: string,
  userId: string,
  gameLinkIsPublic?: boolean
): Promise<{ gameId: string; isPublic: boolean }> {
  const inGame = await userIsInGame(gameId, userId);
  if (!inGame) {
    throw new GameCharacterLinkError("You are not part of this game", 403);
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { gameMaster: true },
  });
  if (!game) {
    throw new GameCharacterLinkError("Game not found", 404);
  }

  const isGameMaster = game.gameMaster === userId;
  const isPublic = isGameMaster
    ? (gameLinkIsPublic ?? false)
    : (gameLinkIsPublic ?? true);

  return { gameId, isPublic };
}
