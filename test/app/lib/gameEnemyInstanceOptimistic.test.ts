import { withRemovedEnemyInstances } from "@/app/lib/gameEnemyInstanceOptimistic";
import type { GameDetail } from "@/app/lib/types/game";
import { describe, expect, it } from "vitest";

type InitiativeEntry = NonNullable<GameDetail["initiativeOrder"]>[number];
type EnemyInstance = NonNullable<GameDetail["enemyInstances"]>[number];

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

function instance(
  partial: Pick<EnemyInstance, "id" | "name" | "status"> &
    Partial<EnemyInstance>
): EnemyInstance {
  return {
    sourceCustomEnemyId: null,
    sourceOfficialEnemyId: null,
    instanceNumber: 1,
    sourceName: partial.name,
    renamed: false,
    numberVisible: false,
    instanceLabel: partial.name,
    isPublic: true,
    imageKey: null,
    maxHealth: 10,
    currentHealth: 10,
    speed: 4,
    initiativeModifier: 0,
    reactionsPerRound: 1,
    reactionsRemaining: 1,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...partial,
  };
}

function game(
  enemyInstances: EnemyInstance[],
  initiativeOrder: InitiativeEntry[]
): GameDetail {
  return {
    id: "g-1",
    name: "Test Game",
    gameMaster: "gm-1",
    users: [],
    enemyInstances,
    initiativeOrder,
  };
}

describe("withRemovedEnemyInstances", () => {
  const goblin = instance({ id: "ei-1", name: "Goblin", status: "ACTIVE" });
  const wolf = instance({ id: "ei-2", name: "Wolf", status: "DEFEATED" });
  const ogre = instance({ id: "ei-3", name: "Ogre", status: "DEAD" });
  const current = game(
    [goblin, wolf, ogre],
    [
      entry({
        combatantType: "CHARACTER",
        combatantId: "c-1",
        combatantName: "Ada",
        rolledValue: 10,
      }),
      entry({
        combatantType: "ENEMY",
        combatantId: "ei-1",
        combatantName: "Goblin",
        rolledValue: 8,
      }),
      entry({
        combatantType: "ENEMY",
        combatantId: "ei-2",
        combatantName: "Wolf",
        rolledValue: 6,
      }),
      entry({
        combatantType: "ENEMY",
        combatantId: "ei-other",
        combatantName: "Kept",
        rolledValue: 4,
      }),
    ]
  );

  it("removes selected instances and matching ENEMY initiative entries", () => {
    const updated = withRemovedEnemyInstances(current, ["ei-1", "ei-3"]);
    expect(updated.enemyInstances).toEqual([wolf]);
    expect(updated.initiativeOrder).toEqual([
      current.initiativeOrder![0],
      current.initiativeOrder![2],
      current.initiativeOrder![3],
    ]);
  });

  it("leaves other game fields unchanged", () => {
    const updated = withRemovedEnemyInstances(current, ["ei-1"]);
    expect(updated.id).toBe("g-1");
    expect(updated.name).toBe("Test Game");
    expect(updated.gameMaster).toBe("gm-1");
    expect(updated.users).toEqual([]);
  });
});
