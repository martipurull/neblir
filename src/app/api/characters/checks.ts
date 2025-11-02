import { CharacterUser } from "@prisma/client";

export function characterBelongsToUser(
  userCharacters: CharacterUser[],
  characterId: string
) {
  return userCharacters
    .map((userCharacter) => userCharacter.characterId)
    .includes(characterId);
}
