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

describe("characterEditableUpdateSchema", () => {
  it("accepts a full paths array and owned features", async () => {
    const { characterEditableUpdateSchema } =
      await import("@/app/api/characters/schemas");
    const { path: _path, ...withoutPath } = makeCharacterCreationRequest();
    const result = characterEditableUpdateSchema.safeParse({
      ...withoutPath,
      generalInformation: {
        ...withoutPath.generalInformation,
        level: 3,
      },
      paths: [
        { pathId: "path-soldier", rank: 2 },
        { pathId: "path-medic", rank: 1 },
      ],
      initialFeatures: [{ featureId: "feat-1", grade: 2 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.paths).toEqual([
        { pathId: "path-soldier", rank: 2 },
        { pathId: "path-medic", rank: 1 },
      ]);
      expect(result.data.initialFeatures).toEqual([
        { featureId: "feat-1", grade: 2 },
      ]);
    }
  });

  it("rejects the retired primary-path body fields", async () => {
    const { characterEditableUpdateSchema } =
      await import("@/app/api/characters/schemas");
    const result = characterEditableUpdateSchema.safeParse({
      ...makeCharacterCreationRequest(),
      primaryPathCharacterId: "pc-primary-1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a single path field instead of paths", async () => {
    const { characterEditableUpdateSchema } =
      await import("@/app/api/characters/schemas");
    const result = characterEditableUpdateSchema.safeParse(
      makeCharacterCreationRequest()
    );
    expect(result.success).toBe(false);
  });

  it("rejects an empty paths array", async () => {
    const { characterEditableUpdateSchema } =
      await import("@/app/api/characters/schemas");
    const { path: _path, ...withoutPath } = makeCharacterCreationRequest();
    const result = characterEditableUpdateSchema.safeParse({
      ...withoutPath,
      paths: [],
    });
    expect(result.success).toBe(false);
  });
});
