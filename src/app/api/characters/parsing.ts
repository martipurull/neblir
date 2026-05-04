import {
  applyArmourPenaltyToInnateAttributeDice,
  getArmourAttributePenalty,
} from "@/app/lib/carryWeightUtils";
import { capInnateAttributeDiceWithEquipment } from "@/app/lib/equippedStatBonuses";
import {
  resolveSpecialAbilityForRace,
  type SpecialAbilityName,
} from "@/app/lib/specialAbility";
import { ValidationError } from "../shared/errors";
import type { LevelUpCharacterBody } from "./[id]/level-up/schema";
import type { CharacterCreationRequest } from "./schemas";
import type { Race } from "@prisma/client";

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
  characterCreationRequest: CharacterCreationRequest | LevelUpCharacterBody
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

export function computeCharacterRequestData(
  parsedCharacterCreationRequest:
    | CharacterCreationRequest
    | LevelUpCharacterBody,
  isLevelUp: boolean = false
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

  const maxInnateAttributeSum = 36;
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
  if (innateAttributesSum > maxInnateAttributeSum) {
    throw new ValidationError(
      `Innate attributes sum exceeds the allowed maximum of ${maxInnateAttributeSum}.`
    );
  }
  const levelUpBonusSkill = isLevelUp ? 1 : 0;
  const learnedSkillsMaxBase =
    14 +
    (parsedCharacterCreationRequest.generalInformation.level -
      1 +
      levelUpBonusSkill);
  const learnedSkillsMax =
    learnedSkillsMaxBase +
    (3 -
      (parsedCharacterCreationRequest.learnedSkills.specialSkills?.length ??
        0));
  // If a learned skill is at max level (5), it counts as 2 towards the total
  const learnedSkillsSum = Object.values(
    parsedCharacterCreationRequest.learnedSkills.generalSkills
  ).reduce((acc, val) => acc + (val === 5 ? val + 1 : val), 0);

  if (learnedSkillsSum > learnedSkillsMax) {
    throw new ValidationError(
      `Learned skills sum exceeds the allowed maximum; received ${learnedSkillsSum} but maximum is ${learnedSkillsMax}.`
    );
  }

  const {
    path: _path,
    wallet: rawWallet,
    initialFeatures: _initialFeatures,
    generalInformation,
    ...requestWithoutPathAndWallet
  } = parsedCharacterCreationRequest as typeof parsedCharacterCreationRequest & {
    path?: { pathId: string; rank: number };
    wallet?: Array<{ currencyName: string; quantity: number }>;
    initialFeatures?: Array<{ featureId: string; grade: number }>;
    generalInformation: {
      race: Race;
      specialAbilityName?: SpecialAbilityName;
    };
  };

  const learnedSkills = requestWithoutPathAndWallet.learnedSkills;
  const learnedSkillsForPrisma =
    learnedSkills != null
      ? {
          ...learnedSkills,
          specialSkills:
            learnedSkills.specialSkills === null
              ? undefined
              : learnedSkills.specialSkills,
        }
      : learnedSkills;

  const wallet =
    (rawWallet?.length ?? 0) > 0
      ? {
          create: (rawWallet ?? []).map((entry) => ({
            currencyName: entry.currencyName,
            quantity: entry.quantity,
          })),
        }
      : undefined;
  const rawHealth = requestWithoutPathAndWallet.health as Record<
    string,
    unknown
  >;
  const currentPhysicalHealthInput =
    typeof rawHealth.currentPhysicalHealth === "number"
      ? rawHealth.currentPhysicalHealth
      : maxPhysicalHealth;
  const currentMentalHealthInput =
    typeof rawHealth.currentMentalHealth === "number"
      ? rawHealth.currentMentalHealth
      : maxMentalHealth;

  return {
    ...requestWithoutPathAndWallet,
    generalInformation: {
      ...(() => {
        const { specialAbilityName: _specialAbilityName, ...rest } =
          generalInformation;
        return rest;
      })(),
      specialAbility: resolveSpecialAbilityForRace(
        generalInformation.race,
        generalInformation.specialAbilityName
      ),
    },
    learnedSkills: learnedSkillsForPrisma,
    wallet,
    notes: [],
    health: {
      ...requestWithoutPathAndWallet.health,
      innatePhysicalHealth: innatePhysicalHealth,
      maxPhysicalHealth: maxPhysicalHealth,
      currentPhysicalHealth: isLevelUp
        ? Math.min(currentPhysicalHealthInput, maxPhysicalHealth)
        : maxPhysicalHealth,
      innateMentalHealth: innateMentalHealth,
      maxMentalHealth: maxMentalHealth,
      currentMentalHealth: isLevelUp
        ? Math.min(currentMentalHealthInput, maxMentalHealth)
        : maxMentalHealth,
      deathSaves: {
        successes: 0,
        failures: 0,
      },
    },
    combatInformation: (() => {
      const armourMod =
        parsedCharacterCreationRequest.combatInformation.armourMod;
      const innateAgility =
        parsedCharacterCreationRequest.innateAttributes.dexterity.agility;
      const effAgility = applyArmourPenaltyToInnateAttributeDice(
        capInnateAttributeDiceWithEquipment(innateAgility, 0),
        getArmourAttributePenalty(armourMod)
      );
      return {
        ...requestWithoutPathAndWallet.combatInformation,
        initiativeMod:
          parsedCharacterCreationRequest.innateAttributes.personality
            .mentality + effAgility,
        speed:
          parsedCharacterCreationRequest.innateAttributes.strength.athletics +
          effAgility +
          10,
        maxCarryWeight: calculateMaxCarryWeight(parsedCharacterCreationRequest),
        reactionsPerRound: reactionsPerRound,
        rangeAttackMod:
          parsedCharacterCreationRequest.innateAttributes.dexterity.manual +
          parsedCharacterCreationRequest.learnedSkills.generalSkills.aim,
        meleeAttackMod:
          parsedCharacterCreationRequest.innateAttributes.strength.bruteForce +
          parsedCharacterCreationRequest.learnedSkills.generalSkills.melee,
        throwAttackMod:
          parsedCharacterCreationRequest.innateAttributes.strength.athletics +
          parsedCharacterCreationRequest.learnedSkills.generalSkills.aim,
        rangeDefenceMod:
          armourMod +
          effAgility +
          parsedCharacterCreationRequest.learnedSkills.generalSkills.acrobatics,
        meleeDefenceMod:
          armourMod +
          parsedCharacterCreationRequest.innateAttributes.strength.resilience +
          parsedCharacterCreationRequest.learnedSkills.generalSkills.melee,
      };
    })(),
  };
}
