import { sortInitiativeEntries } from "@/app/lib/initiativeOrder";
import type { getGameWithDetails } from "@/app/lib/prisma/game";

type GameWithDetails = NonNullable<
  Awaited<ReturnType<typeof getGameWithDetails>>
>;

type VisibleCharacterRow = {
  character: {
    id: string;
    generalInformation?: { name?: string; surname?: string } | null;
  };
};

function shapeInitiativeOrderForResponse(
  game: GameWithDetails,
  visibleCharacters: VisibleCharacterRow[],
  isGameMaster: boolean
) {
  const sorted = sortInitiativeEntries(game.initiativeOrder ?? []);
  const characterById = new Map(
    visibleCharacters.map((gc) => [gc.character.id, gc.character])
  );
  const enemyInstanceById = new Map(
    (game.enemyInstances ?? []).map((enemy) => [enemy.id, enemy])
  );
  return sorted.map((entry) => {
    const ch =
      entry.combatantType === "CHARACTER"
        ? characterById.get(entry.combatantId)
        : undefined;
    const gi = ch?.generalInformation;
    const enemyInstance = enemyInstanceById.get(entry.combatantId);
    const enemyIsPublic = enemyInstance?.isPublic !== false;
    const enemyDisplayName =
      entry.combatantName ?? enemyInstance?.name ?? "Enemy";
    const displayName =
      entry.combatantType === "CHARACTER"
        ? (gi?.name ?? null)
        : !isGameMaster && !enemyIsPublic
          ? "Enemy"
          : enemyDisplayName;
    const displaySurname =
      entry.combatantType === "CHARACTER" ? (gi?.surname ?? null) : null;
    const combatantName =
      entry.combatantType === "ENEMY" && !isGameMaster && !enemyIsPublic
        ? "Enemy"
        : entry.combatantName;
    return {
      combatantType: entry.combatantType,
      combatantId: entry.combatantId,
      combatantName,
      rolledValue: entry.rolledValue,
      initiativeModifier: entry.initiativeModifier,
      submittedAt: entry.submittedAt,
      totalInitiative: entry.rolledValue + entry.initiativeModifier,
      displayName,
      displaySurname,
    };
  });
}

export function shapeGameForResponse(
  game: Awaited<ReturnType<typeof getGameWithDetails>>,
  userId: string
) {
  if (!game) return null;
  const isGameMaster = game.gameMaster === userId;
  const characters = game.characters
    ?.filter((gc) => {
      if (isGameMaster) return true;
      const isOwnedByCurrentUser = gc.character.users.some(
        (u) => u.userId === userId
      );

      if (isOwnedByCurrentUser) return true;
      return gc.isPublic !== false;
    })
    .map((gc) => {
      const gi = gc.character.generalInformation;
      const isOwnedByCurrentUser = gc.character.users.some(
        (u) => u.userId === userId
      );
      const health = gc.character.health;
      const combat = gc.character.combatInformation;
      return {
        ...gc,
        character: {
          id: gc.character.id,
          name: gi?.name ?? "",
          surname: gi?.surname ?? null,
          avatarKey: gi?.avatarKey ?? null,
          isOwnedByCurrentUser,
          generalInformation: gi ?? undefined,
          initiativeMod: combat?.initiativeMod ?? 0,
          linkedUserIds: gc.character.users.map((u) => u.userId),
          currentPhysicalHealth: isGameMaster
            ? health?.currentPhysicalHealth
            : undefined,
          maxPhysicalHealth: isGameMaster
            ? health?.maxPhysicalHealth
            : undefined,
          reactionsPerRound: isGameMaster
            ? combat?.reactionsPerRound
            : undefined,
          reactionsRemaining: isGameMaster
            ? combat?.reactionsRemaining
            : undefined,
          healthStatus: isGameMaster ? health?.status : undefined,
        },
      };
    });
  const visibleEnemyInstances = (game.enemyInstances ?? []).filter((enemy) => {
    if (isGameMaster) return true;
    return enemy.isPublic !== false;
  });
  const {
    initiativeOrder: _rawInitiative,
    enemyInstances: _enemyInstances,
    ...gameRest
  } = game;
  return {
    ...gameRest,
    isGameMaster,
    characters: characters ?? [],
    enemyInstances: visibleEnemyInstances,
    initiativeOrder: shapeInitiativeOrderForResponse(
      game,
      characters ?? [],
      isGameMaster
    ),
    discordIntegration: game.discordIntegration
      ? {
          gameId: game.discordIntegration.gameId,
          guildId: game.discordIntegration.guildId,
          channelId: game.discordIntegration.channelId,
          status: game.discordIntegration.status,
          lastError: game.discordIntegration.lastError ?? null,
        }
      : null,
  };
}
