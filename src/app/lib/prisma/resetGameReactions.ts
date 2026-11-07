import { readBotCombatStats, resolveBotCombatStats } from "@/app/lib/botCombat";
import { prisma } from "./client";

type ReactionCapClient = {
  bot: {
    findUnique(args: {
      where: { id: string };
      select: { numberOfReactions: true };
    }): Promise<{ numberOfReactions?: number | null } | null>;
  };
  customBot: {
    findUnique(args: {
      where: { id: string };
      select: { numberOfReactions: true };
    }): Promise<{ numberOfReactions?: number | null } | null>;
  };
  uniqueBot: {
    findUnique(args: {
      where: { id: string };
      select: {
        numberOfReactionsOverride: true;
        sourceType: true;
        botId: true;
      };
    }): Promise<{
      numberOfReactionsOverride?: number | null;
      sourceType?: string | null;
      botId?: string | null;
    } | null>;
  };
};

async function reactionCap(
  tx: ReactionCapClient,
  holding: { sourceType?: string | null; botId: string }
): Promise<number> {
  if (holding.sourceType === "CUSTOM") {
    const bot = await tx.customBot.findUnique({
      where: { id: holding.botId },
      select: { numberOfReactions: true },
    });
    return readBotCombatStats({
      numberOfReactions: bot?.numberOfReactions ?? undefined,
    }).numberOfReactions;
  }
  if (holding.sourceType === "UNIQUE") {
    const unique = await tx.uniqueBot.findUnique({
      where: { id: holding.botId },
      select: {
        numberOfReactionsOverride: true,
        sourceType: true,
        botId: true,
      },
    });
    if (unique?.sourceType === "CUSTOM" && unique.botId) {
      const bot = await tx.customBot.findUnique({
        where: { id: unique.botId },
        select: { numberOfReactions: true },
      });
      return resolveBotCombatStats(unique, {
        numberOfReactions: bot?.numberOfReactions ?? undefined,
      }).numberOfReactions;
    }
    if (unique?.sourceType === "OFFICIAL" && unique.botId) {
      const bot = await tx.bot.findUnique({
        where: { id: unique.botId },
        select: { numberOfReactions: true },
      });
      return resolveBotCombatStats(unique, {
        numberOfReactions: bot?.numberOfReactions ?? undefined,
      }).numberOfReactions;
    }
    return resolveBotCombatStats(unique, null).numberOfReactions;
  }
  const bot = await tx.bot.findUnique({
    where: { id: holding.botId },
    select: { numberOfReactions: true },
  });
  return readBotCombatStats({
    numberOfReactions: bot?.numberOfReactions ?? undefined,
  }).numberOfReactions;
}

/**
 * Sets reactionsRemaining = reactionsPerRound for every character in this
 * game and every enemy instance spawned into it, and restores bot holdings
 * of those characters to each holding's Reaction cap.
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

    const holdings = await tx.botCharacter.findMany({
      where: { character: { games: { some: { gameId } } } },
      select: {
        id: true,
        botId: true,
        sourceType: true,
        reactionsRemaining: true,
      },
    });

    for (const holding of holdings) {
      const cap = await reactionCap(tx, holding);
      if (holding.reactionsRemaining === cap) continue;
      await tx.botCharacter.update({
        where: { id: holding.id },
        data: { reactionsRemaining: cap },
      });
    }
  });
}
