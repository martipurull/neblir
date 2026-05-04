import { describe, expect, it } from "vitest";
import { sortInitiativeEntries } from "@/app/lib/initiativeOrder";
import type { InitiativeEntry } from "@prisma/client";

function entry(
  partial: Omit<InitiativeEntry, "submittedAt"> & { submittedAt?: Date }
): InitiativeEntry {
  return {
    combatantType: partial.combatantType,
    combatantId: partial.combatantId,
    combatantName: partial.combatantName,
    submittedAt: partial.submittedAt ?? new Date(0),
    rolledValue: partial.rolledValue,
    initiativeModifier: partial.initiativeModifier,
  };
}

describe("sortInitiativeEntries", () => {
  it("orders by total initiative (roll + modifier) descending", () => {
    const a = entry({
      combatantType: "CHARACTER",
      combatantId: "a",
      combatantName: "A",
      rolledValue: 10,
      initiativeModifier: 2,
    });
    const b = entry({
      combatantType: "CHARACTER",
      combatantId: "b",
      combatantName: "B",
      rolledValue: 15,
      initiativeModifier: 0,
    });
    expect(sortInitiativeEntries([a, b]).map((e) => e.combatantId)).toEqual([
      "b",
      "a",
    ]);
  });

  it("breaks ties on total using modifier descending", () => {
    const lowMod = entry({
      combatantType: "CHARACTER",
      combatantId: "low",
      combatantName: "Low",
      rolledValue: 10,
      initiativeModifier: 1,
    });
    const highMod = entry({
      combatantType: "CHARACTER",
      combatantId: "high",
      combatantName: "High",
      rolledValue: 8,
      initiativeModifier: 3,
    });
    expect(
      sortInitiativeEntries([lowMod, highMod]).map((e) => e.combatantId)
    ).toEqual(["high", "low"]);
  });

  it("breaks ties on total and modifier using earlier submission first", () => {
    const first = entry({
      combatantType: "CHARACTER",
      combatantId: "first",
      combatantName: "First",
      rolledValue: 11,
      initiativeModifier: 2,
      submittedAt: new Date("2025-01-01T12:00:00Z"),
    });
    const second = entry({
      combatantType: "CHARACTER",
      combatantId: "second",
      combatantName: "Second",
      rolledValue: 11,
      initiativeModifier: 2,
      submittedAt: new Date("2025-01-01T13:00:00Z"),
    });
    expect(
      sortInitiativeEntries([second, first]).map((e) => e.combatantId)
    ).toEqual(["first", "second"]);
  });
});
