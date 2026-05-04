import { describe, expect, it } from "vitest";
import {
  customEnemyCsvHeaderLine,
  parseCustomEnemyCsv,
  serializeCustomEnemyRowToCsvLine,
} from "@/app/lib/enemyCsv";

describe("enemyCsv actions / additionalActions", () => {
  it("includes actions and additionalActions in header and serialized row", () => {
    const header = customEnemyCsvHeaderLine();
    expect(header).toContain("actions");
    expect(header).toContain("additionalActions");

    const line = serializeCustomEnemyRowToCsvLine({
      name: "Test",
      description: null,
      imageKey: null,
      health: 5,
      speed: 5,
      initiativeModifier: 0,
      numberOfReactions: 1,
      defenceMelee: 0,
      defenceRange: 0,
      defenceGrid: 0,
      attackMelee: 0,
      attackRange: 0,
      attackThrow: 0,
      attackGrid: 0,
      immunities: [],
      resistances: [],
      vulnerabilities: [],
      notes: null,
      actions: [
        {
          name: "Claw",
          description: "<p>Scratch</p>",
          numberOfDiceToHit: 2,
          numberOfDamageDice: 1,
          damageDiceType: 6,
          damageType: "BLADE",
          notes: "melee",
        },
      ],
      additionalActions: [{ name: "Flee", description: "Run away" }],
    });

    const csv = `${header}\n${line}`;
    const { rows, rowErrors } = parseCustomEnemyCsv(csv);
    expect(rowErrors).toEqual([]);
    expect(rows).toHaveLength(1);
    expect(rows[0].actions).toHaveLength(1);
    expect(rows[0].actions[0].name).toBe("Claw");
    expect(rows[0].actions[0].numberOfDiceToHit).toBe(2);
    expect(rows[0].additionalActions).toEqual([
      { name: "Flee", description: "Run away" },
    ]);
  });

  it("parses empty action cells as empty arrays", () => {
    const csv = `${customEnemyCsvHeaderLine()}\nPlain,,,1,1,0,0,0,0,0,0,0,0,0,,,,,,`;
    const { rows, rowErrors } = parseCustomEnemyCsv(csv);
    expect(rowErrors).toEqual([]);
    expect(rows[0]?.actions).toEqual([]);
    expect(rows[0]?.additionalActions).toEqual([]);
  });

  it("accepts JSON nulls in action objects (DB / export style)", () => {
    const actionsJson = JSON.stringify([
      {
        name: "Strike",
        description: null,
        numberOfDiceToHit: null,
        numberOfDamageDice: null,
        damageDiceType: null,
        damageType: null,
        notes: null,
      },
    ]);
    const additionalJson = JSON.stringify([
      {
        name: "Bonus",
        numberOfDiceToHit: 1,
        damageType: "FIRE",
      },
    ]);
    const line = serializeCustomEnemyRowToCsvLine({
      name: "Z",
      description: null,
      imageKey: null,
      health: 1,
      speed: 1,
      initiativeModifier: 0,
      numberOfReactions: 0,
      defenceMelee: 0,
      defenceRange: 0,
      defenceGrid: 0,
      attackMelee: 0,
      attackRange: 0,
      attackThrow: 0,
      attackGrid: 0,
      immunities: [],
      resistances: [],
      vulnerabilities: [],
      notes: null,
      actions: JSON.parse(actionsJson) as never,
      additionalActions: JSON.parse(additionalJson) as never,
    });
    const { rows, rowErrors } = parseCustomEnemyCsv(
      `${customEnemyCsvHeaderLine()}\n${line}`
    );
    expect(rowErrors).toEqual([]);
    expect(rows[0]?.actions).toEqual([{ name: "Strike" }]);
    expect(rows[0]?.additionalActions).toEqual([
      { name: "Bonus", numberOfDiceToHit: 1, damageType: "FIRE" },
    ]);
  });
});
