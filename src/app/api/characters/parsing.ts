import { CharacterCreationRequest, CharacterUpdateRequest } from "./schemas";

export function computeFieldsOnCharacterCreation(parsedCharacterCreationRequest: CharacterCreationRequest) {
    const innatePhysicalHealth = Object.values(parsedCharacterCreationRequest.innateAttributes.constitution).reduce((acc, val) => acc + val, 0)
    const maxPhysicalHealth = innatePhysicalHealth + parsedCharacterCreationRequest.health.rolledPhysicalHealth
    const innateMentalHealth = Object.values(parsedCharacterCreationRequest.innateAttributes.personality).reduce((acc, val) => acc + val, 0)
    const maxMentalHealth = innateMentalHealth + parsedCharacterCreationRequest.health.rolledMentalHealth

    return {
        ...parsedCharacterCreationRequest,
        health: {
            ...parsedCharacterCreationRequest.health,
            innatePhysicalHealth: innatePhysicalHealth,
            maxPhysicalHealth: maxPhysicalHealth,
            currentPhysicalHealth: maxPhysicalHealth,
            innateMentalHealth: innateMentalHealth,
            maxMentalHealth: maxMentalHealth,
            currentMentalHealth: maxMentalHealth,
            deathSaves: {
                successes: 0,
                failures: 0,
            }
        },
        combatInformation: {
            ...parsedCharacterCreationRequest.combatInformation,
            initiativeMod: parsedCharacterCreationRequest.innateAttributes.personality.mentality + parsedCharacterCreationRequest.innateAttributes.dexterity.agility,
            speed: parsedCharacterCreationRequest.innateAttributes.strength.athletics + parsedCharacterCreationRequest.innateAttributes.dexterity.agility + 10,
            rangeAttackMod: parsedCharacterCreationRequest.innateAttributes.dexterity.manual + parsedCharacterCreationRequest.learnedSkills.generalSkills.aim,
            meleeAttackMod: parsedCharacterCreationRequest.innateAttributes.strength.bruteForce + parsedCharacterCreationRequest.learnedSkills.generalSkills.melee,
            GridAttackMod: parsedCharacterCreationRequest.combatInformation.GridMod + parsedCharacterCreationRequest.innateAttributes.personality.mentality + parsedCharacterCreationRequest.learnedSkills.generalSkills.GRID,
            rangeDefenceMod: parsedCharacterCreationRequest.combatInformation.armourMod + parsedCharacterCreationRequest.innateAttributes.dexterity.agility + parsedCharacterCreationRequest.learnedSkills.generalSkills.acrobatics,
            meleeDefenceMod: parsedCharacterCreationRequest.combatInformation.armourMod + parsedCharacterCreationRequest.innateAttributes.strength.resilience + parsedCharacterCreationRequest.learnedSkills.generalSkills.melee,
            GridDefenceMod: parsedCharacterCreationRequest.combatInformation.GridMod + parsedCharacterCreationRequest.innateAttributes.personality.mentality + parsedCharacterCreationRequest.learnedSkills.generalSkills.GRID,
        }
    }
}
