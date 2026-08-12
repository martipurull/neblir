import { describe, expect, it } from "vitest";
import {
  decideEnemyHealthDelta,
  mergeEnemyInstancePatch,
} from "@/app/(pages)/home/games/[id]/gm/enemies/[enemyInstanceId]/enemyInstanceUtils";
import type { EnemyInstanceDetailResponse } from "@/lib/api/enemyInstances";

describe("decideEnemyHealthDelta", () => {
  it("persists a reduced currentHealth when HP stays above 0", () => {
    expect(decideEnemyHealthDelta(10, -1)).toEqual({
      kind: "persist",
      patch: { currentHealth: 9 },
    });
    expect(decideEnemyHealthDelta(10, -5)).toEqual({
      kind: "persist",
      patch: { currentHealth: 5 },
    });
  });

  it("persists healing without opening the zero-HP prompt", () => {
    expect(decideEnemyHealthDelta(3, 5)).toEqual({
      kind: "persist",
      patch: { currentHealth: 8 },
    });
  });

  it("opens the prompt when damage would bring HP from above 0 to 0", () => {
    expect(decideEnemyHealthDelta(5, -5)).toEqual({ kind: "prompt" });
    expect(decideEnemyHealthDelta(1, -1)).toEqual({ kind: "prompt" });
    expect(decideEnemyHealthDelta(3, -10)).toEqual({ kind: "prompt" });
  });

  it("persists when already at 0 (no prompt)", () => {
    expect(decideEnemyHealthDelta(0, -1)).toEqual({
      kind: "persist",
      patch: { currentHealth: 0 },
    });
  });
});

describe("mergeEnemyInstancePatch", () => {
  const base = {
    id: "ei-1",
    gameId: "g-1",
    name: "Goblin",
    currentHealth: 10,
    maxHealth: 10,
    reactionsRemaining: 2,
    reactionsPerRound: 2,
    status: "ACTIVE",
    speed: 30,
    initiativeModifier: 0,
    defenceMelee: 0,
    defenceRange: 0,
    defenceGrid: 0,
    attackMelee: 0,
    attackRange: 0,
    attackThrow: 0,
    attackGrid: 0,
    actions: [],
    additionalActions: [],
  } satisfies EnemyInstanceDetailResponse;

  it("merges patch fields onto the previous instance", () => {
    expect(
      mergeEnemyInstancePatch(base, { currentHealth: 7, status: "DEFEATED" })
    ).toEqual({ ...base, currentHealth: 7, status: "DEFEATED" });
  });
});
