import { prisma } from "./client";

/**
 * Sets reactionsRemaining = reactionsPerRound for every character in this
 * game and every enemy instance spawned into it.
 */
export async function resetReactionsForGame(gameId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const characters = await tx.character.findMany({
      where: { games: { some: { gameId } } },
      select: {
        id: true,
        combatInformation: true,
      },
    });

    for (const character of characters) {
      const combat = character.combatInformation;
      if (combat.reactionsRemaining === combat.reactionsPerRound) {
        continue;
      }
      await tx.character.update({
        where: { id: character.id },
        data: {
          combatInformation: {
            ...combat,
            reactionsRemaining: combat.reactionsPerRound,
          },
        },
      });
    }

    const enemies = await tx.enemyInstance.findMany({
      where: { gameId },
      select: {
        id: true,
        reactionsPerRound: true,
        reactionsRemaining: true,
      },
    });

    for (const enemy of enemies) {
      if (enemy.reactionsRemaining === enemy.reactionsPerRound) {
        continue;
      }
      await tx.enemyInstance.update({
        where: { id: enemy.id },
        data: { reactionsRemaining: enemy.reactionsPerRound },
      });
    }
  });
}
