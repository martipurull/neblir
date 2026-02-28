import { describe, expect, it } from "vitest";
import { computeCharacterRequestData } from "@/app/api/characters/parsing";
import { ValidationError } from "@/app/api/shared/errors";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";
import type { LevelUpCharacterBody } from "@/app/api/characters/[id]/level-up/schema";

const baseAttributes = {
  intelligence: { investigation: 2, memory: 2, deduction: 2 },
  wisdom: { sense: 2, perception: 2, insight: 2 },
  personality: { persuasion: 2, deception: 2, mentality: 2 },
  strength: { athletics: 2, resilience: 2, bruteForce: 2 },
  dexterity: { manual: 2, stealth: 2, agility: 2 },
  constitution: { resistanceInternal: 2, resistanceExternal: 2, stamina: 2 },
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

function makeCharacterCreationRequest(
  overrides: Partial<CharacterCreationRequest> = {}
): CharacterCreationRequest {
  return {
    generalInformation: {
      name: "Test",
      surname: "Character",
      age: 25,
      religion: "HUMANISM",
      profession: "Researcher",
      race: "HUMAN",
      birthplace: "Test City",
      level: 1,
      height: 170,
      weight: 70,
      ...overrides.generalInformation,
    },
    health: {
      rolledPhysicalHealth: 10,
      rolledMentalHealth: 10,
      seriousPhysicalInjuries: 0,
      seriousTrauma: 0,
      deathSaves: null,
      status: "ALIVE",
      ...overrides.health,
    },
    combatInformation: {
      armourMod: 0,
      armourMaxHP: 0,
      armourCurrentHP: 0,
      GridMod: 0,
      ...overrides.combatInformation,
    },
    innateAttributes: {
      ...baseAttributes,
      ...overrides.innateAttributes,
    },
    learnedSkills: {
      generalSkills: {
        ...baseGeneralSkills,
        ...overrides.learnedSkills?.generalSkills,
      },
      specialSkills: overrides.learnedSkills?.specialSkills,
    },
    path: { pathId: "path-1", rank: 1 },
    ...overrides,
  };
}

function makeLevelUpBody(
  overrides: Partial<LevelUpCharacterBody> = {}
): LevelUpCharacterBody {
  return {
    generalInformation: {
      name: "Test",
      surname: "Character",
      age: 25,
      religion: "HUMANISM",
      profession: "Researcher",
      race: "HUMAN",
      birthplace: "Test City",
      level: 2,
      height: 170,
      weight: 70,
      ...overrides.generalInformation,
    },
    health: {
      innatePhysicalHealth: 6,
      rolledPhysicalHealth: 10,
      maxPhysicalHealth: 16,
      currentPhysicalHealth: 16,
      seriousPhysicalInjuries: 0,
      innateMentalHealth: 6,
      rolledMentalHealth: 10,
      maxMentalHealth: 16,
      currentMentalHealth: 16,
      seriousTrauma: 0,
      deathSaves: { successes: 0, failures: 0 },
      status: "ALIVE",
      ...overrides.health,
    },
    combatInformation: {
      initiativeMod: 4,
      speed: 14,
      reactionsPerRound: 1,
      armourMod: 0,
      armourMaxHP: 0,
      armourCurrentHP: 0,
      GridMod: 0,
      rangeAttackMod: 2,
      meleeAttackMod: 4,
      GridAttackMod: 4,
      rangeDefenceMod: 2,
      meleeDefenceMod: 4,
      GridDefenceMod: 4,
      ...overrides.combatInformation,
    },
    innateAttributes: {
      ...baseAttributes,
      ...overrides.innateAttributes,
    },
    learnedSkills: {
      generalSkills: {
        ...baseGeneralSkills,
        aim: 1,
        ...overrides.learnedSkills?.generalSkills,
      },
      specialSkills: overrides.learnedSkills?.specialSkills,
    },
    ...overrides,
  };
}

describe("computeCharacterRequestData", () => {
  describe("character creation (isLevelUp: false)", () => {
    it("returns computed health and combat fields", () => {
      const input = makeCharacterCreationRequest();
      const result = computeCharacterRequestData(input);

      expect(result.health).toMatchObject({
        innatePhysicalHealth: 6,
        maxPhysicalHealth: 16,
        currentPhysicalHealth: 16,
        innateMentalHealth: 6,
        maxMentalHealth: 16,
        currentMentalHealth: 16,
        deathSaves: { successes: 0, failures: 0 },
      });
      expect(result.combatInformation).toMatchObject({
        initiativeMod: 4,
        speed: 14,
        reactionsPerRound: 1,
        maxCarryWeight: 23,
      });
    });

    it("sets reactionsPerRound to 2 for level 3", () => {
      const input = makeCharacterCreationRequest({
        generalInformation: { level: 3 },
      });
      const result = computeCharacterRequestData(input);
      expect(result.combatInformation.reactionsPerRound).toBe(2);
    });

    it("sets reactionsPerRound to 3 for level 4+", () => {
      const input = makeCharacterCreationRequest({
        generalInformation: { level: 4 },
      });
      const result = computeCharacterRequestData(input);
      expect(result.combatInformation.reactionsPerRound).toBe(3);
    });

    it("strips path from output", () => {
      const input = makeCharacterCreationRequest();
      const result = computeCharacterRequestData(input);
      expect(result).not.toHaveProperty("path");
    });

    it("converts specialSkills null to undefined for Prisma", () => {
      const input = makeCharacterCreationRequest({
        learnedSkills: {
          generalSkills: baseGeneralSkills,
          specialSkills: null as unknown as string[],
        },
      });
      const result = computeCharacterRequestData(input);
      expect(result.learnedSkills?.specialSkills).toBeUndefined();
    });

    it("transforms wallet to Prisma create format when present", () => {
      const input = makeCharacterCreationRequest({
        wallet: [
          { currencyName: "CONF", quantity: 100 },
          { currencyName: "NORD", quantity: 50 },
        ],
      });
      const result = computeCharacterRequestData(input);
      expect(result.wallet).toEqual({
        create: [
          { currencyName: "CONF", quantity: 100 },
          { currencyName: "NORD", quantity: 50 },
        ],
      });
    });

    it("sets wallet to undefined when empty or absent", () => {
      const input = makeCharacterCreationRequest();
      const result = computeCharacterRequestData(input);
      expect(result.wallet).toBeUndefined();
    });

    it("includes notes as empty array", () => {
      const input = makeCharacterCreationRequest();
      const result = computeCharacterRequestData(input);
      expect(result.notes).toEqual([]);
    });
  });

  describe("level-up (isLevelUp: true)", () => {
    it("accepts LevelUpCharacterBody and computes correctly", () => {
      const input = makeLevelUpBody();
      const result = computeCharacterRequestData(input, true);

      expect(result.health).toBeDefined();
      expect(result.combatInformation).toBeDefined();
      expect(result.learnedSkills).toBeDefined();
    });

    it("accounts for specialSkills in learned skills max for level-up", () => {
      const input = makeLevelUpBody({
        generalInformation: { level: 2 },
        learnedSkills: {
          generalSkills: { ...baseGeneralSkills, aim: 1, melee: 1 },
          specialSkills: ["Skill A"],
        },
      });
      const result = computeCharacterRequestData(input, true);
      expect(result.learnedSkills).toBeDefined();
    });
  });

  describe("validation errors", () => {
    it("throws ValidationError when innate attributes sum exceeds 36", () => {
      const input = makeCharacterCreationRequest({
        innateAttributes: {
          ...baseAttributes,
          intelligence: { investigation: 5, memory: 5, deduction: 5 },
        },
      });

      expect(() => computeCharacterRequestData(input)).toThrow(ValidationError);
      expect(() => computeCharacterRequestData(input)).toThrow(
        /Innate attributes sum exceeds the allowed maximum of 36/
      );
    });

    it("throws ValidationError when learned skills sum exceeds max", () => {
      const input = makeCharacterCreationRequest({
        generalInformation: { level: 1 },
        learnedSkills: {
          generalSkills: {
            ...baseGeneralSkills,
            research: 5,
            mechanics: 5,
            generalKnowledge: 5,
          },
          specialSkills: [],
        },
      });

      expect(() => computeCharacterRequestData(input)).toThrow(ValidationError);
      expect(() => computeCharacterRequestData(input)).toThrow(
        /Learned skills sum exceeds the allowed maximum/
      );
    });
  });
});
