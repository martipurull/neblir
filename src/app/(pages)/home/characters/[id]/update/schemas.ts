import type { CharacterDetail } from "@/app/lib/types/character";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";

export type CharacterUpdateFormValues = CharacterCreationRequest;

export function toCharacterUpdateFormValues(
  character: CharacterDetail
): CharacterUpdateFormValues {
  const selectedPath =
    character.paths && character.paths.length > 0
      ? character.paths.slice().sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))[0]
      : null;

  return {
    generalInformation: {
      ...character.generalInformation,
      backstory: character.generalInformation.backstory ?? "",
      summary: character.generalInformation.summary ?? "",
      avatarKey: character.generalInformation.avatarKey ?? "",
    },
    health: {
      rolledPhysicalHealth: character.health.rolledPhysicalHealth,
      rolledMentalHealth: character.health.rolledMentalHealth,
      seriousPhysicalInjuries: character.health.seriousPhysicalInjuries,
      seriousTrauma: character.health.seriousTrauma,
      status: character.health.status,
    },
    combatInformation: {
      armourMod: character.combatInformation.armourMod,
      armourMaxHP: character.combatInformation.armourMaxHP,
      armourCurrentHP: character.combatInformation.armourCurrentHP,
      GridMod: character.combatInformation.GridMod,
      throwAttackMod: character.combatInformation.throwAttackMod,
    },
    innateAttributes: character.innateAttributes,
    learnedSkills: {
      generalSkills: character.learnedSkills.generalSkills,
      specialSkills: [
        character.learnedSkills.specialSkills?.[0] ?? "",
        character.learnedSkills.specialSkills?.[1] ?? "",
        character.learnedSkills.specialSkills?.[2] ?? "",
      ],
    },
    wallet: character.wallet ?? [],
    path: {
      pathId: selectedPath?.id ?? "",
      rank: selectedPath?.rank ?? character.generalInformation.level ?? 1,
    },
    initialFeatures: (character.features ?? []).map((feature) => ({
      featureId: feature.featureId,
      grade: feature.grade,
    })),
  };
}
