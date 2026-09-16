import { describe, expect, it } from "vitest";
import type { CharacterDetail } from "@/app/lib/types/character";
import { toCharacterUpdateFormValues } from "@/app/(pages)/home/characters/[id]/update/schemas";

const baseAttributes = {
  intelligence: { investigation: 1, memory: 1, deduction: 1 },
  wisdom: { sense: 1, perception: 1, insight: 1 },
  personality: { persuasion: 1, deception: 1, mentality: 1 },
  strength: { athletics: 1, resilience: 1, bruteForce: 1 },
  dexterity: { manual: 1, stealth: 1, agility: 1 },
  constitution: {
    resistanceInternal: 1,
    resistanceExternal: 1,
    stamina: 1,
  },
};

const baseGeneralSkills = {
  mechanics: 0,
  software: 0,
  generalKnowledge: 0,
  history: 0,
  driving: 0,
  acrobatics: 0,
  aim: 0,
  melee: 0,
  GRID: 0,
  research: 0,
  medicine: 0,
  science: 0,
  survival: 0,
  streetwise: 0,
  performance: 0,
  manipulationNegotiation: 0,
};

function makeCharacterDetail(
  overrides: Partial<CharacterDetail> = {}
): CharacterDetail {
  return {
    id: "char-1",
    generalInformation: {
      name: "Nova",
      surname: "Voss",
      age: 28,
      religion: "ATHEIST",
      profession: "Scout",
      race: "HUMAN",
      birthplace: "Orbit",
      level: 4,
      height: 170,
      weight: 70,
      backstory: "<p>Story</p>",
      summary: "<p>Summary</p>",
      avatarKey: "avatar-1",
      specialAbility: {
        name: "INNATE_MANIPULATION",
        description: "desc",
      },
    },
    health: {
      innatePhysicalHealth: 6,
      rolledPhysicalHealth: 14,
      maxPhysicalHealth: 20,
      currentPhysicalHealth: 20,
      seriousPhysicalInjuries: 0,
      innateMentalHealth: 6,
      rolledMentalHealth: 12,
      maxMentalHealth: 18,
      currentMentalHealth: 18,
      seriousTrauma: 1,
      status: "ALIVE",
    },
    combatInformation: {
      initiativeMod: 2,
      speed: 12,
      reactionsPerRound: 1,
      reactionsRemaining: 1,
      armourMod: 0,
      armourMaxHP: 0,
      armourCurrentHP: 0,
      rangeAttackMod: 1,
      meleeAttackMod: 1,
      throwAttackMod: 0,
      rangeDefenceMod: 1,
      meleeDefenceMod: 1,
    },
    innateAttributes: baseAttributes,
    learnedSkills: {
      generalSkills: baseGeneralSkills,
      specialSkills: ["Tracking"],
    },
    wallet: [{ currencyName: "CONF", quantity: 10 }],
    paths: [],
    features: [],
    ...overrides,
  };
}

describe("toCharacterUpdateFormValues", () => {
  it("maps every path with its rank instead of a single primary path", () => {
    const character = makeCharacterDetail({
      paths: [
        {
          id: "path-medic",
          name: "SCIENTIST_DOCTOR",
          baseFeature: "medic-base",
          rank: 1,
          pathCharacterId: "pc-medic",
        },
        {
          id: "path-soldier",
          name: "SOLDIER",
          baseFeature: "soldier-base",
          rank: 3,
          pathCharacterId: "pc-soldier",
        },
      ],
    });

    const values = toCharacterUpdateFormValues(character);

    expect(values.paths).toEqual([
      { pathId: "path-medic", rank: 1, name: "SCIENTIST_DOCTOR" },
      { pathId: "path-soldier", rank: 3, name: "SOLDIER" },
    ]);
    expect(values).not.toHaveProperty("path");
    expect(values).not.toHaveProperty("primaryPathCharacterId");
  });

  it("maps owned features and omits persisted special ability objects", () => {
    const character = makeCharacterDetail({
      paths: [
        {
          id: "path-soldier",
          name: "SOLDIER",
          baseFeature: "soldier-base",
          rank: 4,
          pathCharacterId: "pc-soldier",
        },
      ],
      features: [
        {
          id: "fc-1",
          featureId: "feat-1",
          characterId: "char-1",
          grade: 2,
          feature: {
            id: "feat-1",
            name: "Cover fire",
            minPathRank: 1,
            maxGrade: 3,
            applicablePaths: ["SOLDIER"],
          },
        },
      ],
    });

    const values = toCharacterUpdateFormValues(character);

    expect(values.initialFeatures).toEqual([
      {
        featureId: "feat-1",
        grade: 2,
        name: "Cover fire",
        maxGrade: 3,
        minPathRank: 1,
        applicablePaths: ["SOLDIER"],
      },
    ]);
    expect(values.generalInformation.specialAbilityName).toBe(
      "INNATE_MANIPULATION"
    );
    expect(values.generalInformation).not.toHaveProperty("specialAbility");
  });

  it("leaves paths empty when the character has no paths", () => {
    const values = toCharacterUpdateFormValues(makeCharacterDetail());

    expect(values.paths).toEqual([]);
    expect(values).not.toHaveProperty("primaryPathCharacterId");
    expect(values.initialFeatures).toEqual([]);
  });
});
