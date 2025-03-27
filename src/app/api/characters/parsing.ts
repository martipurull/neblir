import { CharacterCreationRequest, CharacterUpdateRequest } from "./schemas";

export function computeFieldsOnCharacterCreation(parsedCharacterCreationRequest: CharacterCreationRequest) {
    const innatePhysicalHealth = Object.values(parsedCharacterCreationRequest.innateAttributes.constitution).reduce((acc, val) => acc + val, 0)
    const maxPhysicalHealth = innatePhysicalHealth + parsedCharacterCreationRequest.health.rolledPhysicalHealth
    const innateMentalHealth = Object.values(parsedCharacterCreationRequest.innateAttributes.personality).reduce((acc, val) => acc + val, 0)
    const maxMentalHealth = innateMentalHealth + parsedCharacterCreationRequest.health.rolledMentalHealth

    const innateAttributesSum =
        Object.values(
            parsedCharacterCreationRequest.innateAttributes.intelligence).reduce((acc, val) => acc + val, 0)
        + Object.values(
            parsedCharacterCreationRequest.innateAttributes.wisdom).reduce((acc, val) => acc + val, 0)
        + Object.values(
            parsedCharacterCreationRequest.innateAttributes.personality).reduce((acc, val) => acc + val, 0)
        + Object.values(
            parsedCharacterCreationRequest.innateAttributes.strength).reduce((acc, val) => acc + val, 0)
        + Object.values(
            parsedCharacterCreationRequest.innateAttributes.dexterity).reduce((acc, val) => acc + val, 0)
        + Object.values(
            parsedCharacterCreationRequest.innateAttributes.constitution).reduce((acc, val) => acc + val, 0)

    if (innateAttributesSum > 30) {
        return null
    }

    const learnedSkillsMax = (12 + (parsedCharacterCreationRequest.generalInformation.level - 1) + (3 - (parsedCharacterCreationRequest.learnedSkills.specialSkills?.length ?? 0)))
    const learnedSkillsSum =
        Object.values(parsedCharacterCreationRequest.learnedSkills.generalSkills)
            .reduce((acc, val) => acc + (val === 5 ? val + 1 : val), 0)

    if (learnedSkillsSum > learnedSkillsMax) {
        return null
    }

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
