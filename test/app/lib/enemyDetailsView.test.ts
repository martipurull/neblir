import { describe, expect, it } from "vitest";
import {
  enemyInstanceToDetailsModel,
  enemyTemplateToDetailsModel,
  formatDamageTypeList,
  formatEnemyActionCombatLine,
  formatSignedModifier,
} from "@/app/lib/enemyDetailsView";

const template = {
  description: "<p>A hunter</p>",
  notes: "<p>Keep distance</p>",
  health: 12,
  speed: 8,
  initiativeModifier: 2,
  numberOfReactions: 1,
  defenceMelee: 3,
  defenceRange: 2,
  defenceGrid: 1,
  attackMelee: 4,
  attackRange: 2,
  attackThrow: 0,
  attackGrid: 1,
  immunities: ["NERVE"],
  resistances: ["SIIKE"],
  vulnerabilities: ["BULLET", "FIRE"],
  actions: [
    {
      name: "Slash",
      numberOfDiceToHit: 2,
      numberOfDamageDice: 3,
      damageDiceType: 6,
      damageType: "BLADE",
      notes: "Reach 2m",
    },
  ],
  additionalActions: [],
};

describe("enemyDetailsView", () => {
  it("maps a template enemy onto the shared details model", () => {
    expect(enemyTemplateToDetailsModel(template)).toMatchObject({
      health: 12,
      reactions: 1,
      immunities: ["NERVE"],
      actions: [{ name: "Slash", damageType: "BLADE" }],
    });
  });

  it("maps an instance using max health and reactions per round", () => {
    expect(
      enemyInstanceToDetailsModel({
        ...template,
        maxHealth: 20,
        reactionsPerRound: 3,
      })
    ).toMatchObject({
      health: 20,
      reactions: 3,
    });
  });

  it("treats missing trait lists as empty", () => {
    const model = enemyTemplateToDetailsModel({
      ...template,
      immunities: null,
      resistances: undefined,
      vulnerabilities: null,
      actions: null,
    });
    expect(model.immunities).toEqual([]);
    expect(model.resistances).toEqual([]);
    expect(model.vulnerabilities).toEqual([]);
    expect(model.actions).toEqual([]);
  });

  it("formats signed modifiers, damage lists, and action combat lines", () => {
    expect(formatSignedModifier(2)).toBe("+2");
    expect(formatSignedModifier(-1)).toBe("-1");
    expect(formatSignedModifier(0)).toBe("+0");
    expect(formatDamageTypeList([])).toBe("None");
    expect(formatDamageTypeList(["BULLET", "FIRE"])).toBe("BULLET, FIRE");
    expect(formatEnemyActionCombatLine(template.actions[0])).toBe(
      "To hit 2d10 · Damage 3d6 BLADE"
    );
    expect(formatEnemyActionCombatLine({ name: "Roar" })).toBeNull();
  });
});
