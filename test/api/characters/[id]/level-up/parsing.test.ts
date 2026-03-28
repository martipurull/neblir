import { describe, expect, it } from "vitest";
import type { CharacterForLevelUp } from "@/app/api/characters/[id]/level-up/parsing";
import { applyLevelUpAttributeSwaps } from "@/app/api/characters/[id]/level-up/parsing";

function innateAll(value: number): CharacterForLevelUp["innateAttributes"] {
  return {
    intelligence: {
      investigation: value,
      memory: value,
      deduction: value,
    },
    wisdom: { sense: value, perception: value, insight: value },
    personality: {
      persuasion: value,
      deception: value,
      mentality: value,
    },
    strength: {
      athletics: value,
      resilience: value,
      bruteForce: value,
    },
    dexterity: { manual: value, stealth: value, agility: value },
    constitution: {
      resistanceInternal: value,
      resistanceExternal: value,
      stamina: value,
    },
  };
}

describe("applyLevelUpAttributeSwaps", () => {
  it("decrements the source and increments the target across groups", () => {
    const innate = innateAll(3);
    const result = applyLevelUpAttributeSwaps(innate, [
      {
        from: { attribute: "intelligence", property: "investigation" },
        to: { attribute: "wisdom", property: "sense" },
      },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.innateAttributes.intelligence.investigation).toBe(2);
    expect(result.innateAttributes.wisdom.sense).toBe(4);
  });

  it("updates two stats in the same attribute group", () => {
    const innate = innateAll(3);
    innate.intelligence.investigation = 4;
    innate.intelligence.memory = 2;
    const result = applyLevelUpAttributeSwaps(innate, [
      {
        from: { attribute: "intelligence", property: "investigation" },
        to: { attribute: "intelligence", property: "memory" },
      },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.innateAttributes.intelligence.investigation).toBe(3);
    expect(result.innateAttributes.intelligence.memory).toBe(3);
  });

  it("rejects when the source is already at minimum (1)", () => {
    const innate = innateAll(3);
    innate.strength.athletics = 1;
    const result = applyLevelUpAttributeSwaps(innate, [
      {
        from: { attribute: "strength", property: "athletics" },
        to: { attribute: "strength", property: "resilience" },
      },
    ]);
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error.issues[0]?.message).toContain("minimum");
    }
  });

  it("rejects when the target is already at maximum (5)", () => {
    const innate = innateAll(3);
    innate.dexterity.agility = 5;
    const result = applyLevelUpAttributeSwaps(innate, [
      {
        from: { attribute: "dexterity", property: "manual" },
        to: { attribute: "dexterity", property: "agility" },
      },
    ]);
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.error.issues[0]?.message).toContain("maximum");
    }
  });

  it("rejects when from and to are the same stat", () => {
    const innate = innateAll(3);
    const result = applyLevelUpAttributeSwaps(innate, [
      {
        from: { attribute: "wisdom", property: "insight" },
        to: { attribute: "wisdom", property: "insight" },
      },
    ]);
    expect(result.ok).toBe(false);
  });
});
