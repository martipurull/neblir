import {
  withAdjustedInitiativeEntry,
  withClearedInitiative,
  withRemovedInitiativeEntry,
} from "@/app/lib/gameInitiativeOptimistic";
import type { GameDetail } from "@/app/lib/types/game";
import { describe, expect, it } from "vitest";

type InitiativeEntry = NonNullable<GameDetail["initiativeOrder"]>[number];

function entry(
  partial: Pick<
    InitiativeEntry,
    "combatantType" | "combatantId" | "combatantName" | "rolledValue"
  > &
    Partial<InitiativeEntry>
): InitiativeEntry {
  const initiativeModifier = partial.initiativeModifier ?? 0;
  return {
    combatantType: partial.combatantType,
    combatantId: partial.combatantId,
    combatantName: partial.combatantName,
    rolledValue: partial.rolledValue,
    initiativeModifier,
    submittedAt: partial.submittedAt ?? new Date("2026-01-01T00:00:00Z"),
    totalInitiative: partial.rolledValue + initiativeModifier,
    displayName: partial.displayName,
    displaySurname: partial.displaySurname,
  };
}

function game(initiativeOrder: InitiativeEntry[]): GameDetail {
  return {
    id: "g-1",
    name: "Test Game",
    gameMaster: "gm-1",
    users: [],
    initiativeOrder,
  };
}

describe("withClearedInitiative", () => {
  it("empties initiative order and leaves other game fields", () => {
    const current = game([
      entry({
        combatantType: "CHARACTER",
        combatantId: "c-1",
        combatantName: "Ada",
        rolledValue: 8,
      }),
    ]);
    expect(withClearedInitiative(current)).toEqual({
      ...current,
      initiativeOrder: [],
    });
  });
});

describe("withRemovedInitiativeEntry", () => {
  const current = game([
    entry({
      combatantType: "CHARACTER",
      combatantId: "c-1",
      combatantName: "Ada",
      rolledValue: 10,
    }),
    entry({
      combatantType: "ENEMY",
      combatantId: "e-1",
      combatantName: "Wolf",
      rolledValue: 6,
    }),
  ]);

  it("removes a character by CHARACTER:id", () => {
    expect(
      withRemovedInitiativeEntry(current, "CHARACTER:c-1").initiativeOrder
    ).toEqual([current.initiativeOrder![1]]);
  });

  it("removes an enemy by ENEMY:id", () => {
    expect(
      withRemovedInitiativeEntry(current, "ENEMY:e-1").initiativeOrder
    ).toEqual([current.initiativeOrder![0]]);
  });

  it("returns the same game when the combatant ref is invalid", () => {
    expect(withRemovedInitiativeEntry(current, "c-1")).toBe(current);
  });
});

describe("withAdjustedInitiativeEntry", () => {
  it("updates modifier and total, then re-sorts by total initiative", () => {
    const current = game([
      entry({
        combatantType: "CHARACTER",
        combatantId: "ahead",
        combatantName: "Ahead",
        rolledValue: 10,
        initiativeModifier: 1,
      }),
      entry({
        combatantType: "CHARACTER",
        combatantId: "behind",
        combatantName: "Behind",
        rolledValue: 9,
        initiativeModifier: 0,
      }),
    ]);

    const updated = withAdjustedInitiativeEntry(current, "CHARACTER:behind", 3);
    expect(updated.initiativeOrder?.map((e) => e.combatantId)).toEqual([
      "behind",
      "ahead",
    ]);
    expect(updated.initiativeOrder?.[0]).toMatchObject({
      combatantId: "behind",
      initiativeModifier: 3,
      totalInitiative: 12,
    });
  });

  it("returns the same game when the combatant ref is invalid", () => {
    const current = game([]);
    expect(withAdjustedInitiativeEntry(current, "nope", 1)).toBe(current);
  });
});
