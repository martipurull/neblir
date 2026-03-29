import { describe, expect, it } from "vitest";
import { sortCharacterInitiativeEntries } from "@/app/lib/initiativeOrder";
import type { CharacterInitiative } from "@prisma/client";

function entry(
  partial: Omit<CharacterInitiative, "submittedAt"> & { submittedAt?: Date }
): CharacterInitiative {
  return {
    submittedAt: partial.submittedAt ?? new Date(0),
    characterId: partial.characterId,
    rolledValue: partial.rolledValue,
    initiativeModifier: partial.initiativeModifier,
  };
}

describe("sortCharacterInitiativeEntries", () => {
  it("orders by total initiative (roll + modifier) descending", () => {
    const a = entry({
      characterId: "a",
      rolledValue: 10,
      initiativeModifier: 2,
    });
    const b = entry({
      characterId: "b",
      rolledValue: 15,
      initiativeModifier: 0,
    });
    expect(
      sortCharacterInitiativeEntries([a, b]).map((e) => e.characterId)
    ).toEqual(["b", "a"]);
  });

  it("breaks ties on total using modifier descending", () => {
    const lowMod = entry({
      characterId: "low",
      rolledValue: 10,
      initiativeModifier: 1,
    });
    const highMod = entry({
      characterId: "high",
      rolledValue: 8,
      initiativeModifier: 3,
    });
    expect(
      sortCharacterInitiativeEntries([lowMod, highMod]).map(
        (e) => e.characterId
      )
    ).toEqual(["high", "low"]);
  });

  it("breaks ties on total and modifier using earlier submission first", () => {
    const first = entry({
      characterId: "first",
      rolledValue: 11,
      initiativeModifier: 2,
      submittedAt: new Date("2025-01-01T12:00:00Z"),
    });
    const second = entry({
      characterId: "second",
      rolledValue: 11,
      initiativeModifier: 2,
      submittedAt: new Date("2025-01-01T13:00:00Z"),
    });
    expect(
      sortCharacterInitiativeEntries([second, first]).map((e) => e.characterId)
    ).toEqual(["first", "second"]);
  });
});
