import { describe, expect, it } from "vitest";
import { characterCreationRequestSchema } from "@/app/api/characters/schemas";
import type { CharacterCreationRequest } from "@/app/api/characters/schemas";

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

function makeCharacterCreationRequest(
  overrides: Partial<CharacterCreationRequest> = {}
): CharacterCreationRequest {
  return {
    generalInformation: {
      name: "Ada",
      surname: "Lovelace",
      age: 25,
      religion: "ATHEIST",
      profession: "Engineer",
      race: "HUMAN",
      birthplace: "London",
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
      status: "ALIVE",
      ...overrides.health,
    },
    combatInformation: {
      armourMod: 0,
      armourMaxHP: 0,
      armourCurrentHP: 0,
      throwAttackMod: 0,
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
    path: { pathId: "path-1", rank: 1, ...overrides.path },
    ...overrides,
  };
}

describe("characterCreationRequestSchema", () => {
  it("rejects an empty character name", () => {
    const result = characterCreationRequestSchema.safeParse(
      makeCharacterCreationRequest({
        generalInformation: { name: "" },
      })
    );
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only character names", () => {
    const result = characterCreationRequestSchema.safeParse(
      makeCharacterCreationRequest({
        generalInformation: { name: "   " },
      })
    );
    expect(result.success).toBe(false);
  });

  it("rejects an empty path id", () => {
    const result = characterCreationRequestSchema.safeParse(
      makeCharacterCreationRequest({
        path: { pathId: "", rank: 1 },
      })
    );
    expect(result.success).toBe(false);
  });

  it("accepts a valid character creation payload", () => {
    const result = characterCreationRequestSchema.safeParse(
      makeCharacterCreationRequest()
    );
    expect(result.success).toBe(true);
  });
});
