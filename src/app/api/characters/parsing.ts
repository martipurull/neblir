import { ValidationError } from "../shared/errors";
import { CharacterCreationRequest } from "./schemas";

function calculateReactionsPerRound(level: number): number {
    if (level === 3) {
        return 2;
    }
    if (level >= 4) {
        return 3;
    }
    return 1;
}

function calculateMaxCarryWeight(
    characterCreationRequest: CharacterCreationRequest
) {
    const baseMaxCarryWeight =
        characterCreationRequest.generalInformation.race === "KINIAN"
            ? 30
            : characterCreationRequest.generalInformation.race === "HUMAN"
                ? 20
                : characterCreationRequest.generalInformation.race === "MANFENN"
                    ? 15
                    : 10;
    const strengthMod =
        Object.values(characterCreationRequest.innateAttributes.strength).reduce(
            (acc, val) => acc + val,
            0
        ) - 3;
    return baseMaxCarryWeight + strengthMod;
}

export function computeFieldsOnCharacterCreation(
    parsedCharacterCreationRequest: CharacterCreationRequest
) {
    const innatePhysicalHealth = Object.values(
        parsedCharacterCreationRequest.innateAttributes.constitution
    ).reduce((acc, val) => acc + val, 0);
    const maxPhysicalHealth =
        innatePhysicalHealth +
        parsedCharacterCreationRequest.health.rolledPhysicalHealth;
    const innateMentalHealth = Object.values(
        parsedCharacterCreationRequest.innateAttributes.personality
    ).reduce((acc, val) => acc + val, 0);
    const maxMentalHealth =
        innateMentalHealth +
        parsedCharacterCreationRequest.health.rolledMentalHealth;
    const reactionsPerRound = calculateReactionsPerRound(
        parsedCharacterCreationRequest.generalInformation.level
    );

    const innateAttributesGroups = [
        "intelligence",
        "wisdom",
        "personality",
        "strength",
        "dexterity",
        "constitution",
    ] as const;

    type InnateAttributeGroup = (typeof innateAttributesGroups)[number];

    const innateAttributesSum = innateAttributesGroups.reduce((total, group) => {
        const groupValues = Object.values(
            parsedCharacterCreationRequest.innateAttributes[
            group as InnateAttributeGroup
            ]
        ) as number[];
        return (
            total + groupValues.reduce((acc: number, val: number) => acc + val, 0)
        );
    }, 0);

    if (innateAttributesSum > 30) {
        throw new ValidationError(
            "Innate attributes sum exceeds the allowed maximum of 30"
        );
    }

    const learnedSkillsMax =
        12 +
        (parsedCharacterCreationRequest.generalInformation.level - 1) +
        (3 -
            (parsedCharacterCreationRequest.learnedSkills.specialSkills?.length ??
                0));
    // If a learned skill is at max level (5), it counts as 2 towards the total
    const learnedSkillsSum = Object.values(
        parsedCharacterCreationRequest.learnedSkills.generalSkills
    ).reduce((acc, val) => acc + (val === 5 ? val + 1 : val), 0);

    if (learnedSkillsSum > learnedSkillsMax) {
        throw new ValidationError("Learned skills sum exceeds the allowed maximum");
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
            },
        },
        combatInformation: {
            ...parsedCharacterCreationRequest.combatInformation,
            initiativeMod:
                parsedCharacterCreationRequest.innateAttributes.personality.mentality +
                parsedCharacterCreationRequest.innateAttributes.dexterity.agility,
            speed:
                parsedCharacterCreationRequest.innateAttributes.strength.athletics +
                parsedCharacterCreationRequest.innateAttributes.dexterity.agility +
                10,
            maxCarryWeight: calculateMaxCarryWeight(parsedCharacterCreationRequest),
            reactionsPerRound: reactionsPerRound,
            rangeAttackMod:
                parsedCharacterCreationRequest.innateAttributes.dexterity.manual +
                parsedCharacterCreationRequest.learnedSkills.generalSkills.aim,
            meleeAttackMod:
                parsedCharacterCreationRequest.innateAttributes.strength.bruteForce +
                parsedCharacterCreationRequest.learnedSkills.generalSkills.melee,
            GridAttackMod:
                parsedCharacterCreationRequest.combatInformation.GridMod +
                parsedCharacterCreationRequest.innateAttributes.personality.mentality +
                parsedCharacterCreationRequest.learnedSkills.generalSkills.GRID,
            rangeDefenceMod:
                parsedCharacterCreationRequest.combatInformation.armourMod +
                parsedCharacterCreationRequest.innateAttributes.dexterity.agility +
                parsedCharacterCreationRequest.learnedSkills.generalSkills.acrobatics,
            meleeDefenceMod:
                parsedCharacterCreationRequest.combatInformation.armourMod +
                parsedCharacterCreationRequest.innateAttributes.strength.resilience +
                parsedCharacterCreationRequest.learnedSkills.generalSkills.melee,
            GridDefenceMod:
                parsedCharacterCreationRequest.combatInformation.GridMod +
                parsedCharacterCreationRequest.innateAttributes.personality.mentality +
                parsedCharacterCreationRequest.learnedSkills.generalSkills.GRID,
        },
    };
}
