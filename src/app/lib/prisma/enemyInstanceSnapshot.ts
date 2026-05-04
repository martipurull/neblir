import type { CustomEnemy, Enemy, Prisma } from "@prisma/client";

/** Shared stat snapshot for creating an EnemyInstance (excludes ids, runtime fields). */
export function uncheckedSnapshotFromEnemyTemplate(
  template: Enemy | CustomEnemy,
  overrides: Pick<
    Prisma.EnemyInstanceUncheckedCreateInput,
    "gameId" | "name" | "sourceCustomEnemyId" | "sourceOfficialEnemyId"
  >
): Prisma.EnemyInstanceUncheckedCreateInput {
  return {
    ...overrides,
    imageKey: template.imageKey ?? undefined,
    description: template.description ?? undefined,
    notes: template.notes ?? undefined,
    maxHealth: template.health,
    currentHealth: template.health,
    speed: template.speed,
    initiativeModifier: template.initiativeModifier,
    reactionsPerRound: template.numberOfReactions,
    reactionsRemaining: template.numberOfReactions,
    defenceMelee: template.defenceMelee,
    defenceRange: template.defenceRange,
    defenceGrid: template.defenceGrid,
    attackMelee: template.attackMelee,
    attackRange: template.attackRange,
    attackThrow: template.attackThrow,
    attackGrid: template.attackGrid,
    immunities: template.immunities,
    resistances: template.resistances,
    vulnerabilities: template.vulnerabilities,
    actions: template.actions ?? [],
    additionalActions: template.additionalActions ?? [],
  };
}
