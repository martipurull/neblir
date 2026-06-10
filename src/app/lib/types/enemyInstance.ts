type EnemyAction = {
  name: string;
  description?: string;
  numberOfDiceToHit?: number;
  numberOfDamageDice?: number;
  damageDiceType?: number;
  damageType?: string;
  notes?: string;
};

type EnemyInstanceStatus = "ACTIVE" | "DEFEATED" | "DEAD";

export type EnemyInstancePatch = {
  name?: string;
  description?: string | null;
  notes?: string;
  imageKey?: string | null;
  isPublic?: boolean;
  currentHealth?: number;
  maxHealth?: number;
  speed?: number;
  initiativeModifier?: number;
  reactionsPerRound?: number;
  reactionsRemaining?: number;
  status?: EnemyInstanceStatus;
};

export type EnemyInstanceDetailResponse = {
  id: string;
  gameId: string;
  name: string;
  isPublic?: boolean;
  imageKey?: string | null;
  currentHealth: number;
  maxHealth: number;
  reactionsRemaining: number;
  reactionsPerRound: number;
  status: EnemyInstanceStatus;
  speed: number;
  initiativeModifier: number;
  description?: string | null;
  notes?: string | null;
  defenceMelee: number;
  defenceRange: number;
  defenceGrid: number;
  attackMelee: number;
  attackRange: number;
  attackThrow: number;
  attackGrid: number;
  actions: EnemyAction[];
  additionalActions: EnemyAction[];
};

export type SpawnEnemyInstancesBody =
  | {
      sourceCustomEnemyId: string;
      count?: number;
      nameOverride?: string;
      isPublic?: boolean;
      sourceOfficialEnemyId?: undefined;
    }
  | {
      sourceOfficialEnemyId: string;
      count?: number;
      nameOverride?: string;
      isPublic?: boolean;
      sourceCustomEnemyId?: undefined;
    };
