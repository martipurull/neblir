import { describe, expect, it } from "vitest";
import {
  applyAttackRollSession,
  attackRollSessionShown,
  openAttackRollSession,
} from "@/app/lib/attackRollSession";

const sword = {
  weaponName: "Sword",
  damageText: "2d6, blade",
  numberOfDice: 2,
  diceType: 6,
};

const axe = {
  weaponName: "Axe",
  damageText: "1d8, blade",
  numberOfDice: 1,
  diceType: 8,
};

describe("attack roll session", () => {
  it("shows the to-hit dice and Deal Damage frozen to that weapon option after a success", () => {
    const rolled = [10, 4];
    const weapon = { ...sword };
    const session = applyAttackRollSession(
      openAttackRollSession({ combatant: "character", attackType: "melee" }),
      { type: "toHitRoll", dice: rolled, weapon }
    );
    weapon.weaponName = "Renamed";
    weapon.numberOfDice = 9;
    rolled[0] = 1;

    expect(attackRollSessionShown(session)).toEqual({
      toHitDice: [10, 4],
      dealDamage: {
        weapon: sword,
        extraDamageDice: 0,
        damageResult: null,
      },
      selectedWeapon: null,
      extraToHitDice: 0,
    });
  });

  it("shows the weapon option selected on open before any roll", () => {
    const session = openAttackRollSession({
      combatant: "character",
      attackType: "melee",
      selectedWeapon: sword,
    });

    expect(attackRollSessionShown(session)).toEqual({
      toHitDice: null,
      dealDamage: null,
      selectedWeapon: sword,
      extraToHitDice: 0,
    });
  });

  it("hides Deal Damage after a miss and still shows the to-hit dice", () => {
    const session = applyAttackRollSession(
      openAttackRollSession({ combatant: "character", attackType: "melee" }),
      { type: "toHitRoll", dice: [7, 2], weapon: sword }
    );

    expect(attackRollSessionShown(session)).toEqual({
      toHitDice: [7, 2],
      dealDamage: null,
      selectedWeapon: null,
      extraToHitDice: 0,
    });
  });

  it("keeps the to-hit dice and Deal Damage when a sheet refresh rebuilds the weapon option, including a limited-use weapon spending a use", () => {
    const limitedUse = { ...sword, damageText: "2d6, blade (3 uses)" };
    const session = applyAttackRollSession(
      openAttackRollSession({ combatant: "character", attackType: "range" }),
      { type: "toHitRoll", dice: [8, 8, 1], weapon: limitedUse }
    );
    limitedUse.damageText = "2d6, blade (2 uses)";

    expect(attackRollSessionShown(session).toHitDice).toEqual([8, 8, 1]);
    expect(attackRollSessionShown(session).dealDamage).toEqual({
      weapon: { ...sword, damageText: "2d6, blade (3 uses)" },
      extraDamageDice: 0,
      damageResult: null,
    });
  });

  it("does not rewrite the frozen block when the selected weapon option changes", () => {
    const session = applyAttackRollSession(
      applyAttackRollSession(
        openAttackRollSession({ combatant: "character", attackType: "melee" }),
        { type: "toHitRoll", dice: [9, 3], weapon: sword }
      ),
      { type: "changeSelectedWeapon", weapon: axe }
    );
    const shown = attackRollSessionShown(session);

    expect(shown.selectedWeapon).toEqual(axe);
    expect(shown.toHitDice).toEqual([9, 3]);
    expect(shown.dealDamage?.weapon).toEqual(sword);
  });

  it("keeps extra damage dice editable and repeats the damage roll on the frozen weapon option", () => {
    let session = applyAttackRollSession(
      openAttackRollSession({ combatant: "character", attackType: "melee" }),
      { type: "toHitRoll", dice: [9], weapon: sword }
    );
    session = applyAttackRollSession(session, {
      type: "changeSelectedWeapon",
      weapon: axe,
    });
    session = applyAttackRollSession(session, {
      type: "changeExtraDamageDice",
      extraDamageDice: 2,
    });
    session = applyAttackRollSession(session, {
      type: "damageRoll",
      dice: [6, 3, 1],
    });

    expect(attackRollSessionShown(session).dealDamage).toEqual({
      weapon: sword,
      extraDamageDice: 2,
      damageResult: [6, 3, 1],
    });

    session = applyAttackRollSession(session, {
      type: "changeExtraDamageDice",
      extraDamageDice: -1,
    });
    session = applyAttackRollSession(session, {
      type: "damageRoll",
      dice: [4],
    });
    const shown = attackRollSessionShown(session);

    expect(shown.dealDamage).toEqual({
      weapon: sword,
      extraDamageDice: -1,
      damageResult: [4],
    });
    expect(shown.selectedWeapon).toEqual(axe);
    expect(shown.toHitDice).toEqual([9]);
  });

  it("clears the previous to-hit result and Deal Damage on the next attack roll", () => {
    let session = applyAttackRollSession(
      openAttackRollSession({ combatant: "character", attackType: "melee" }),
      { type: "toHitRoll", dice: [10, 5], weapon: sword }
    );
    session = applyAttackRollSession(session, {
      type: "changeExtraDamageDice",
      extraDamageDice: 3,
    });
    session = applyAttackRollSession(session, {
      type: "damageRoll",
      dice: [6],
    });
    session = applyAttackRollSession(session, {
      type: "changeExtraToHitDice",
      extraToHitDice: 2,
    });
    session = applyAttackRollSession(session, {
      type: "toHitRoll",
      dice: [3, 2],
      weapon: axe,
    });
    const shown = attackRollSessionShown(session);

    expect(shown.toHitDice).toEqual([3, 2]);
    expect(shown.dealDamage).toBeNull();
    expect(shown.extraToHitDice).toBe(2);
  });

  it("starts a new Deal Damage block on the next success, without rewriting the previous dice when extra to-hit dice change", () => {
    let session = applyAttackRollSession(
      openAttackRollSession({ combatant: "character", attackType: "throw" }),
      { type: "toHitRoll", dice: [10, 5], weapon: sword }
    );
    session = applyAttackRollSession(session, {
      type: "changeExtraDamageDice",
      extraDamageDice: 3,
    });
    session = applyAttackRollSession(session, {
      type: "damageRoll",
      dice: [6],
    });
    session = applyAttackRollSession(session, {
      type: "changeExtraToHitDice",
      extraToHitDice: 1,
    });

    expect(attackRollSessionShown(session).toHitDice).toEqual([10, 5]);
    expect(attackRollSessionShown(session).dealDamage?.weapon).toEqual(sword);

    session = applyAttackRollSession(session, {
      type: "toHitRoll",
      dice: [8, 1],
      weapon: axe,
    });
    const shown = attackRollSessionShown(session);

    expect(shown.toHitDice).toEqual([8, 1]);
    expect(shown.extraToHitDice).toBe(1);
    expect(shown.dealDamage).toEqual({
      weapon: axe,
      extraDamageDice: 0,
      damageResult: null,
    });
  });

  it("hides Deal Damage for a character GRID attack with no damage dice", () => {
    const session = applyAttackRollSession(
      openAttackRollSession({ combatant: "character", attackType: "grid" }),
      {
        type: "toHitRoll",
        dice: [10, 9],
        weapon: {
          weaponName: "GRID",
          damageText: "",
          numberOfDice: 0,
          diceType: 4,
        },
      }
    );
    const shown = attackRollSessionShown(session);

    expect(shown.toHitDice).toEqual([10, 9]);
    expect(shown.dealDamage).toBeNull();
  });

  it("shows Deal Damage for a character GRID attack that already has damage dice", () => {
    const gridWeapon = {
      weaponName: "GRID",
      damageText: "1d6",
      numberOfDice: 1,
      diceType: 6,
      damageDice: [{ numberOfDice: 1, diceType: 6 }],
    };
    const session = applyAttackRollSession(
      openAttackRollSession({ combatant: "character", attackType: "grid" }),
      { type: "toHitRoll", dice: [8], weapon: gridWeapon }
    );

    expect(attackRollSessionShown(session).dealDamage?.weapon).toEqual(
      gridWeapon
    );
  });

  it("shows Deal Damage after a success for an enemy instance attack with no damage dice", () => {
    const claw = {
      weaponName: "Claw",
      damageText: "",
      numberOfDice: 0,
      diceType: 4,
    };
    const session = applyAttackRollSession(
      openAttackRollSession({
        combatant: "enemyInstance",
        attackType: "melee",
      }),
      { type: "toHitRoll", dice: [8, 1], weapon: claw }
    );

    expect(attackRollSessionShown(session).dealDamage).toEqual({
      weapon: claw,
      extraDamageDice: 0,
      damageResult: null,
    });
  });

  it("shows Deal Damage after a success for an enemy GRID attack with no damage dice", () => {
    const grid = {
      weaponName: "GRID",
      damageText: "",
      numberOfDice: 0,
      diceType: 4,
    };
    const session = applyAttackRollSession(
      openAttackRollSession({
        combatant: "enemyInstance",
        attackType: "grid",
      }),
      { type: "toHitRoll", dice: [9], weapon: grid }
    );

    expect(attackRollSessionShown(session).dealDamage?.weapon).toEqual(grid);
  });

  it("ignores a damage roll when Deal Damage is hidden", () => {
    const session = applyAttackRollSession(
      applyAttackRollSession(
        openAttackRollSession({ combatant: "character", attackType: "melee" }),
        { type: "toHitRoll", dice: [2], weapon: sword }
      ),
      { type: "damageRoll", dice: [6] }
    );

    expect(attackRollSessionShown(session).dealDamage).toBeNull();
    expect(attackRollSessionShown(session).toHitDice).toEqual([2]);
  });
});
