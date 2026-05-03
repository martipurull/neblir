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
  visibleCharacters: VisibleCharacterRow[]
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
    const displayName =
      entry.combatantType === "CHARACTER"
        ? (gi?.name ?? null)
        : (entry.combatantName ?? enemyInstance?.name ?? "Enemy");
    const displaySurname =
      entry.combatantType === "CHARACTER" ? (gi?.surname ?? null) : null;
    return {
      combatantType: entry.combatantType,
      combatantId: entry.combatantId,
      combatantName: entry.combatantName,
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
      // `??` is wrong here: `false ?? x` stays `false`, so non-owned public NPCs were hidden.
      // Legacy rows without `isPublic` are treated as visible; explicit `false` hides from non-owners.
      if (isOwnedByCurrentUser) return true;
      return gc.isPublic !== false;
    })
    .map((gc) => {
      const gi = gc.character.generalInformation;
      const isOwnedByCurrentUser = gc.character.users.some(
        (u) => u.userId === userId
      );
      return {
        ...gc,
        character: {
          id: gc.character.id,
          name: gi?.name ?? "",
          surname: gi?.surname ?? null,
          avatarKey: gi?.avatarKey ?? null,
          isOwnedByCurrentUser,
          generalInformation: gi ?? undefined,
          initiativeMod: gc.character.combatInformation?.initiativeMod ?? 0,
          linkedUserIds: gc.character.users.map((u) => u.userId),
        },
      };
    });
  const { initiativeOrder: _rawInitiative, ...gameRest } = game;
  return {
    ...gameRest,
    isGameMaster,
    characters: characters ?? game.characters,
    initiativeOrder: shapeInitiativeOrderForResponse(game, characters ?? []),
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
