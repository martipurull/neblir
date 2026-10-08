import { describe, expect, it } from "vitest";
import type { CharacterDetail, ItemCharacter } from "@/app/lib/types/character";
import type { DamageRollWeaponOption } from "@/app/lib/damageRollWeaponOptions";
import { getDamageRollWeaponOptions } from "@/app/lib/damageRollWeaponOptions";

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

function makeCharacter(
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
      level: 1,
      height: 170,
      weight: 70,
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
      throwAttackMod: 1,
      rangeDefenceMod: 1,
      meleeDefenceMod: 1,
    },
    innateAttributes: baseAttributes,
    learnedSkills: {
      generalSkills: {
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
      },
      specialSkills: [],
    },
    features: [],
    inventory: [],
    ...overrides,
  };
}

function weapon(args: {
  id: string;
  name: string;
  customName?: string | null;
  attackRoll?: Array<"MELEE" | "RANGE" | "THROW" | "GRID">;
  equipSlots?: ItemCharacter["equipSlots"];
  itemLocation?: string;
  currentUses?: number;
  maxUses?: number | null;
  status?: ItemCharacter["status"];
  damage?: {
    numberOfDice: number;
    diceType: number;
    damageType: Array<"BLADE" | "BULLET" | "BLUDGEONING" | "GRID">;
  } | null;
  gridAttackBonus?: number;
}): ItemCharacter {
  return {
    id: args.id,
    characterId: "char-1",
    sourceType: "GLOBAL_ITEM",
    itemId: args.id,
    quantity: 1,
    currentUses: args.currentUses ?? 0,
    isEquipped: (args.equipSlots?.length ?? 0) > 0,
    equipSlots: args.equipSlots ?? [],
    customName: args.customName ?? null,
    status: args.status ?? "FUNCTIONAL",
    itemLocation: args.itemLocation ?? "carried",
    item: {
      name: args.name,
      attackRoll: args.attackRoll ?? ["MELEE"],
      maxUses: args.maxUses,
      gridAttackBonus: args.gridAttackBonus,
      damage: args.damage,
    },
  };
}

function softwareWarrior(
  grade: number
): NonNullable<CharacterDetail["features"]>[number] {
  return {
    id: "fc-sw",
    featureId: "feat-sw",
    characterId: "char-1",
    grade,
    feature: {
      id: "feat-sw",
      name: "Software Warrior",
      description: null,
      minPathRank: 1,
      maxGrade: 4,
      examples: null,
      applicablePaths: ["SOLDIER"],
    },
  };
}

function row(
  attackMode: DamageRollWeaponOption["attackMode"],
  displayName: string,
  label: string,
  damageDice: DamageRollWeaponOption["damageDice"],
  extraDiceType: number
): DamageRollWeaponOption {
  return { attackMode, displayName, label, damageDice, extraDiceType };
}

describe("getDamageRollWeaponOptions", () => {
  it("lists melee Unarmed, range Improvised weapon, and throw Unarmed when nothing is equipped", () => {
    expect(getDamageRollWeaponOptions(makeCharacter())).toEqual([
      {
        attackMode: "melee",
        displayName: "Unarmed",
        label: "Unarmed — Melee — 1d4, bludgeoning",
        damageDice: [{ numberOfDice: 1, diceType: 4 }],
        extraDiceType: 4,
      },
      {
        attackMode: "range",
        displayName: "Improvised weapon",
        label: "Improvised weapon — Range — 1d4, bludgeoning",
        damageDice: [{ numberOfDice: 1, diceType: 4 }],
        extraDiceType: 4,
      },
      {
        attackMode: "throw",
        displayName: "Unarmed",
        label: "Unarmed — Throw — 1d4, bludgeoning",
        damageDice: [{ numberOfDice: 1, diceType: 4 }],
        extraDiceType: 4,
      },
    ]);
  });

  it("lists equipped weapons after Unarmed or Improvised weapon, once per hand and attack mode, in carried order", () => {
    const character = makeCharacter({
      inventory: [
        weapon({
          id: "dagger",
          name: "Dagger",
          attackRoll: ["MELEE"],
          damage: { numberOfDice: 1, diceType: 4, damageType: ["BLADE"] },
        }),
        weapon({
          id: "sword",
          name: "Sword",
          customName: "Old blade",
          attackRoll: ["MELEE", "THROW"],
          equipSlots: ["HAND"],
          damage: { numberOfDice: 2, diceType: 6, damageType: ["BLADE"] },
        }),
        weapon({
          id: "rifle",
          name: "Rifle",
          attackRoll: ["RANGE"],
          equipSlots: ["HAND"],
          maxUses: 2,
          currentUses: 0,
          damage: { numberOfDice: 1, diceType: 8, damageType: ["BULLET"] },
        }),
        weapon({
          id: "axe",
          name: "Axe",
          attackRoll: ["MELEE"],
          equipSlots: ["HAND", "HAND"],
          damage: { numberOfDice: 1, diceType: 10, damageType: ["BLADE"] },
        }),
        weapon({
          id: "pistol",
          name: "Pistol",
          attackRoll: ["RANGE"],
          equipSlots: ["HAND"],
          maxUses: 6,
          currentUses: 2,
          damage: { numberOfDice: 1, diceType: 6, damageType: ["BULLET"] },
        }),
        weapon({
          id: "spear",
          name: "Spear",
          attackRoll: ["MELEE"],
          equipSlots: ["HAND"],
          itemLocation: "vehicle:rig-1",
          damage: { numberOfDice: 1, diceType: 6, damageType: ["BLADE"] },
        }),
        weapon({
          id: "club",
          name: "Club",
          attackRoll: ["MELEE"],
          equipSlots: ["HAND"],
          status: "BROKEN",
          damage: {
            numberOfDice: 1,
            diceType: 4,
            damageType: ["BLUDGEONING"],
          },
        }),
      ],
    });

    const unarmed = row(
      "melee",
      "Unarmed",
      "Unarmed — Melee — 1d4, bludgeoning",
      [{ numberOfDice: 1, diceType: 4 }],
      4
    );
    const improvised = row(
      "range",
      "Improvised weapon",
      "Improvised weapon — Range — 1d4, bludgeoning",
      [{ numberOfDice: 1, diceType: 4 }],
      4
    );
    const unarmedThrow = row(
      "throw",
      "Unarmed",
      "Unarmed — Throw — 1d4, bludgeoning",
      [{ numberOfDice: 1, diceType: 4 }],
      4
    );

    expect(getDamageRollWeaponOptions(character)).toEqual([
      unarmed,
      row(
        "melee",
        "Old blade",
        "Old blade — Melee — 2d6, blade",
        [{ numberOfDice: 2, diceType: 6 }],
        6
      ),
      row(
        "melee",
        "Axe",
        "Axe — Melee — 1d10, blade",
        [{ numberOfDice: 1, diceType: 10 }],
        10
      ),
      row(
        "melee",
        "Axe",
        "Axe — Melee — 1d10, blade",
        [{ numberOfDice: 1, diceType: 10 }],
        10
      ),
      improvised,
      row(
        "range",
        "Pistol",
        "Pistol — Range — 1d6, bullet",
        [{ numberOfDice: 1, diceType: 6 }],
        6
      ),
      unarmedThrow,
      row(
        "throw",
        "Old blade",
        "Old blade — Throw — 2d6, blade",
        [{ numberOfDice: 2, diceType: 6 }],
        6
      ),
    ]);
  });

  it("adds a GRID attack when a Brain item already deals damage", () => {
    const character = makeCharacter({
      inventory: [
        weapon({
          id: "patch",
          name: "Spike",
          attackRoll: ["GRID"],
          equipSlots: ["BRAIN"],
          gridAttackBonus: 2,
          damage: { numberOfDice: 1, diceType: 8, damageType: ["GRID"] },
        }),
      ],
    });

    expect(getDamageRollWeaponOptions(character).at(-1)).toEqual(
      row(
        "grid",
        "GRID",
        "GRID — GRID — 1d8, grid",
        [{ numberOfDice: 1, diceType: 8 }],
        8
      )
    );
  });

  it("adds a GRID attack from Software Warrior dice when no Brain item deals damage", () => {
    const character = makeCharacter({
      features: [softwareWarrior(1)],
    });

    expect(getDamageRollWeaponOptions(character).at(-1)).toEqual(
      row(
        "grid",
        "GRID",
        "GRID — GRID — 1d6",
        [{ numberOfDice: 1, diceType: 6 }],
        6
      )
    );
  });

  it("adds Brain-item damage and Software Warrior dice on one GRID attack", () => {
    const character = makeCharacter({
      features: [softwareWarrior(4)],
      inventory: [
        weapon({
          id: "patch",
          name: "Spike",
          attackRoll: ["GRID"],
          equipSlots: ["BRAIN"],
          gridAttackBonus: 2,
          damage: { numberOfDice: 1, diceType: 8, damageType: ["GRID"] },
        }),
      ],
    });

    expect(getDamageRollWeaponOptions(character).at(-1)).toEqual(
      row(
        "grid",
        "GRID",
        "GRID — GRID — 1d8, grid + 2d6",
        [
          { numberOfDice: 1, diceType: 8 },
          { numberOfDice: 2, diceType: 6 },
        ],
        8
      )
    );
  });

  it("omits a to-hit-only GRID attack and a Brain item with no uses left", () => {
    const toHitOnly = makeCharacter({
      inventory: [
        weapon({
          id: "patch",
          name: "Scanner",
          attackRoll: ["GRID"],
          equipSlots: ["BRAIN"],
          gridAttackBonus: 3,
          damage: null,
        }),
      ],
    });
    const spent = makeCharacter({
      inventory: [
        weapon({
          id: "patch",
          name: "Spike",
          attackRoll: ["GRID"],
          equipSlots: ["BRAIN"],
          gridAttackBonus: 2,
          maxUses: 1,
          currentUses: 0,
          damage: { numberOfDice: 1, diceType: 8, damageType: ["GRID"] },
        }),
      ],
    });

    expect(getDamageRollWeaponOptions(toHitOnly)).toHaveLength(3);
    expect(getDamageRollWeaponOptions(spent)).toHaveLength(3);
    expect(
      getDamageRollWeaponOptions(toHitOnly).some(
        (option) => option.attackMode === "grid"
      )
    ).toBe(false);
    expect(
      getDamageRollWeaponOptions(spent).some(
        (option) => option.attackMode === "grid"
      )
    ).toBe(false);
  });
});
