import type { GameDetail } from "@/app/lib/types/game";

export type InitiativeEntry = NonNullable<
  GameDetail["initiativeOrder"]
>[number];
export type GameCharacterRow = NonNullable<GameDetail["characters"]>[number];
export type EnemyInstanceRow = NonNullable<
  GameDetail["enemyInstances"]
>[number];

export type GmCombatInitiativeSectionProps = {
  game: GameDetail;
  initiativeOrder: NonNullable<GameDetail["initiativeOrder"]>;
  hasInitiativeEntries: boolean;
  clearingInitiative: boolean;
  resettingReactions: boolean;
  initiativeActionId: string | null;
  onClearAll: () => void;
  onResetReactions: () => void;
  onRemoveEntry: (combatantRef: string) => void;
  onAdjustEntry: (combatantRef: string, initiativeDelta: number) => void;
  onOpenRollModal: () => void;
};

export type CombatTrackerRowProps = {
  entry: InitiativeEntry;
  index: number;
  gameId: string;
  character?: GameCharacterRow["character"];
  enemy?: EnemyInstanceRow;
  imageUrl: string | null | undefined;
  initiativeActionId: string | null;
  onAdjustEntry: (combatantRef: string, initiativeDelta: number) => void;
  onRemoveEntry: (combatantRef: string) => void;
};
