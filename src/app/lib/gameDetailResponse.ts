import { sortCharacterInitiativeEntries } from "@/app/lib/initiativeOrder";
import type { getGameWithDetails } from "@/app/lib/prisma/game";

type GameWithDetails = NonNullable<
  Awaited<ReturnType<typeof getGameWithDetails>>
>;

function shapeInitiativeOrderForResponse(game: GameWithDetails) {
  const sorted = sortCharacterInitiativeEntries(game.initiativeOrder ?? []);
  const characterById = new Map(
    game.characters.map((gc) => [gc.character.id, gc.character])
  );
  return sorted.map((entry) => {
    const ch = characterById.get(entry.characterId);
    const gi = ch?.generalInformation;
    return {
      characterId: entry.characterId,
      rolledValue: entry.rolledValue,
      initiativeModifier: entry.initiativeModifier,
      submittedAt: entry.submittedAt,
      totalInitiative: entry.rolledValue + entry.initiativeModifier,
      characterName: gi?.name ?? null,
      characterSurname: gi?.surname ?? null,
    };
  });
}

export function shapeGameForResponse(
  game: Awaited<ReturnType<typeof getGameWithDetails>>,
  userId: string
) {
  if (!game) return null;
  const isGameMaster = game.gameMaster === userId;
  const characters = game.characters?.map((gc) => {
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
    initiativeOrder: shapeInitiativeOrderForResponse(game),
  };
}
