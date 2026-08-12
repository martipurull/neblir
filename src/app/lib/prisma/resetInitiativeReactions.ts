import type { InitiativeCombatantType } from "@prisma/client";
import { prisma } from "./client";

type InitiativeCombatantRef = {
  combatantType: InitiativeCombatantType;
  combatantId: string;
};

/**
 * Sets reactionsRemaining = reactionsPerRound for every character and enemy
 * instance referenced by the given initiative order (scoped to this game).
 * Missing / stale combatant ids are skipped.
 */
export async function resetReactionsForInitiativeOrder(
  gameId: string,
  initiativeOrder: InitiativeCombatantRef[]
): Promise<void> {
  const characterIds = [
    ...new Set(
      initiativeOrder
        .filter((entry) => entry.combatantType === "CHARACTER")
        .map((entry) => entry.combatantId)
    ),
  ];
  const enemyIds = [
    ...new Set(
      initiativeOrder
        .filter((entry) => entry.combatantType === "ENEMY")
        .map((entry) => entry.combatantId)
    ),
  ];

  if (characterIds.length === 0 && enemyIds.length === 0) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (characterIds.length > 0) {
      const characters = await tx.character.findMany({
        where: {
          id: { in: characterIds },
          games: { some: { gameId } },
        },
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
    }

    if (enemyIds.length > 0) {
      const enemies = await tx.enemyInstance.findMany({
        where: {
          id: { in: enemyIds },
          gameId,
        },
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
    }
  });
}
