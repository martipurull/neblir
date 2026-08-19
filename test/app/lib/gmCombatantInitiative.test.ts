import {
  gmCombatantInitiativeRollEvent,
  gmCombatantInitiativeSubmitBody,
  hasCombatantInitiativeEntry,
} from "@/app/lib/gmCombatantInitiative";
import type { GameDetail } from "@/app/lib/types/game";
import { describe, expect, it } from "vitest";

describe("hasCombatantInitiativeEntry", () => {
  const game = {
    initiativeOrder: [
      {
        combatantType: "CHARACTER",
        combatantId: "c-1",
        combatantName: "Ada",
        rolledValue: 8,
        initiativeModifier: 1,
        submittedAt: new Date("2026-01-01T00:00:00Z"),
        totalInitiative: 9,
      },
    ],
  } as Pick<GameDetail, "initiativeOrder">;

  it("finds a matching combatant", () => {
    expect(hasCombatantInitiativeEntry(game, "CHARACTER", "c-1")).toBe(true);
  });

  it("returns false when the combatant has not rolled", () => {
    expect(hasCombatantInitiativeEntry(game, "ENEMY", "c-1")).toBe(false);
    expect(hasCombatantInitiativeEntry(game, "CHARACTER", "c-2")).toBe(false);
  });
});

describe("gmCombatantInitiativeSubmitBody", () => {
  it("omits a blank character name", () => {
    expect(
      gmCombatantInitiativeSubmitBody({
        combatantType: "CHARACTER",
        combatantId: "c-1",
        combatantName: "  ",
        rolledValue: 7,
        initiativeModifier: 2,
      })
    ).toEqual({
      combatantType: "CHARACTER",
      combatantId: "c-1",
      rolledValue: 7,
      initiativeModifier: 2,
    });
  });

  it("includes a trimmed character name", () => {
    expect(
      gmCombatantInitiativeSubmitBody({
        combatantType: "CHARACTER",
        combatantId: "c-1",
        combatantName: " Ada ",
        rolledValue: 7,
        initiativeModifier: 2,
      })
    ).toEqual({
      combatantType: "CHARACTER",
      combatantId: "c-1",
      combatantName: "Ada",
      rolledValue: 7,
      initiativeModifier: 2,
    });
  });

  it("defaults a missing enemy name to Enemy", () => {
    expect(
      gmCombatantInitiativeSubmitBody({
        combatantType: "ENEMY",
        combatantId: "e-1",
        rolledValue: 4,
        initiativeModifier: 1,
      })
    ).toEqual({
      combatantType: "ENEMY",
      combatantId: "e-1",
      combatantName: "Enemy",
      rolledValue: 4,
      initiativeModifier: 1,
    });
  });
});

describe("gmCombatantInitiativeRollEvent", () => {
  it("omits isPrivate for public rolls and includes characterId", () => {
    const event = gmCombatantInitiativeRollEvent({
      combatantType: "CHARACTER",
      combatantId: "c-1",
      combatantName: "Ada",
      rolledValue: 6,
      initiativeModifier: 2,
      isPrivate: false,
      source: "gmNpcCard",
    });
    expect(event.characterId).toBe("c-1");
    expect(event.isPrivate).toBeUndefined();
    expect(event.rollType).toBe("INITIATIVE");
    expect(event.results).toEqual([6]);
    expect(event.total).toBe(8);
  });

  it("marks private enemy rolls and includes enemy metadata", () => {
    expect(
      gmCombatantInitiativeRollEvent({
        combatantType: "ENEMY",
        combatantId: "e-1",
        combatantName: "Wolf",
        rolledValue: 5,
        initiativeModifier: 3,
        isPrivate: true,
        source: "gmEnemyList",
      })
    ).toMatchObject({
      characterId: undefined,
      isPrivate: true,
      total: 8,
      metadata: {
        source: "gmEnemyList",
        combatantType: "ENEMY",
        enemyInstanceId: "e-1",
        enemyName: "Wolf",
      },
    });
  });
});
