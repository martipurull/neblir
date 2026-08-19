import { weaponDamageTypeLabel } from "@/app/lib/weaponDamageTypeLabel";

export type EnemyDetailsAction = {
  name: string;
  description?: string | null;
  notes?: string | null;
  numberOfDiceToHit?: number | null;
  numberOfDamageDice?: number | null;
  damageDiceType?: number | null;
  damageType?: string | null;
};

export type EnemyDetailsModel = {
  description?: string | null;
  notes?: string | null;
  health: number;
  speed: number;
  initiativeModifier: number;
  reactions: number;
  defenceMelee: number;
  defenceRange: number;
  defenceGrid: number;
  attackMelee: number;
  attackRange: number;
  attackThrow: number;
  attackGrid: number;
  immunities: readonly string[];
  resistances: readonly string[];
  vulnerabilities: readonly string[];
  actions: EnemyDetailsAction[];
  additionalActions: EnemyDetailsAction[];
};

type EnemyTemplateSource = {
  description?: string | null;
  notes?: string | null;
  health: number;
  speed: number;
  initiativeModifier: number;
  numberOfReactions: number;
  defenceMelee: number;
  defenceRange: number;
  defenceGrid: number;
  attackMelee: number;
  attackRange: number;
  attackThrow: number;
  attackGrid: number;
  immunities?: readonly string[] | null;
  resistances?: readonly string[] | null;
  vulnerabilities?: readonly string[] | null;
  actions?: EnemyDetailsAction[] | null;
  additionalActions?: EnemyDetailsAction[] | null;
};

type EnemyInstanceSource = {
  description?: string | null;
  notes?: string | null;
  maxHealth: number;
  speed: number;
  initiativeModifier: number;
  reactionsPerRound: number;
  defenceMelee: number;
  defenceRange: number;
  defenceGrid: number;
  attackMelee: number;
  attackRange: number;
  attackThrow: number;
  attackGrid: number;
  immunities?: readonly string[] | null;
  resistances?: readonly string[] | null;
  vulnerabilities?: readonly string[] | null;
  actions?: EnemyDetailsAction[] | null;
  additionalActions?: EnemyDetailsAction[] | null;
};

function listOrEmpty(values: readonly string[] | null | undefined): string[] {
  return values ? [...values] : [];
}

function actionsOrEmpty(
  values: EnemyDetailsAction[] | null | undefined
): EnemyDetailsAction[] {
  return values ?? [];
}

export function enemyTemplateToDetailsModel(
  enemy: EnemyTemplateSource
): EnemyDetailsModel {
  return {
    description: enemy.description,
    notes: enemy.notes,
    health: enemy.health,
    speed: enemy.speed,
    initiativeModifier: enemy.initiativeModifier,
    reactions: enemy.numberOfReactions,
    defenceMelee: enemy.defenceMelee,
    defenceRange: enemy.defenceRange,
    defenceGrid: enemy.defenceGrid,
    attackMelee: enemy.attackMelee,
    attackRange: enemy.attackRange,
    attackThrow: enemy.attackThrow,
    attackGrid: enemy.attackGrid,
    immunities: listOrEmpty(enemy.immunities),
    resistances: listOrEmpty(enemy.resistances),
    vulnerabilities: listOrEmpty(enemy.vulnerabilities),
    actions: actionsOrEmpty(enemy.actions),
    additionalActions: actionsOrEmpty(enemy.additionalActions),
  };
}

export function enemyInstanceToDetailsModel(
  enemy: EnemyInstanceSource
): EnemyDetailsModel {
  return {
    description: enemy.description,
    notes: enemy.notes,
    health: enemy.maxHealth,
    speed: enemy.speed,
    initiativeModifier: enemy.initiativeModifier,
    reactions: enemy.reactionsPerRound,
    defenceMelee: enemy.defenceMelee,
    defenceRange: enemy.defenceRange,
    defenceGrid: enemy.defenceGrid,
    attackMelee: enemy.attackMelee,
    attackRange: enemy.attackRange,
    attackThrow: enemy.attackThrow,
    attackGrid: enemy.attackGrid,
    immunities: listOrEmpty(enemy.immunities),
    resistances: listOrEmpty(enemy.resistances),
    vulnerabilities: listOrEmpty(enemy.vulnerabilities),
    actions: actionsOrEmpty(enemy.actions),
    additionalActions: actionsOrEmpty(enemy.additionalActions),
  };
}

export function formatSignedModifier(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

export function formatDamageTypeList(values: readonly string[]): string {
  if (values.length === 0) return "None";
  return values.map(weaponDamageTypeLabel).join(", ");
}

export function formatEnemyActionCombatLine(
  action: EnemyDetailsAction
): string | null {
  const parts: string[] = [];
  if (action.numberOfDiceToHit) {
    parts.push(`To hit ${action.numberOfDiceToHit}d10`);
  }
  if (action.numberOfDamageDice && action.damageDiceType) {
    const typeLabel = action.damageType
      ? ` ${weaponDamageTypeLabel(action.damageType)}`
      : "";
    parts.push(
      `Damage ${action.numberOfDamageDice}d${action.damageDiceType}${typeLabel}`
    );
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
