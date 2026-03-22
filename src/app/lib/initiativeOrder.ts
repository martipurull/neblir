import type { CharacterInitiative } from "@prisma/client";

/** Higher total first; tie → higher modifier; tie → earlier submission first. */
export function sortCharacterInitiativeEntries(
  entries: CharacterInitiative[]
): CharacterInitiative[] {
  return [...entries].sort((a, b) => {
    const totalA = a.rolledValue + a.initiativeModifier;
    const totalB = b.rolledValue + b.initiativeModifier;
    if (totalB !== totalA) return totalB - totalA;
    if (b.initiativeModifier !== a.initiativeModifier) {
      return b.initiativeModifier - a.initiativeModifier;
    }
    return a.submittedAt.getTime() - b.submittedAt.getTime();
  });
}
