"use client";

import { AttackRollModal } from "@/app/components/character/AttackRollModal";
import { DefenceRollModal } from "@/app/components/character/DefenceRollModal";
import { InitiativeOrderModal } from "@/app/components/character/InitiativeOrderModal";
import { EditEnemyInstanceModal } from "@/app/components/games/EditEnemyInstanceModal";
import { EnemyInstanceDiceRollerModal } from "@/app/components/games/EnemyInstanceDiceRollerModal";
import { RollResultQuickModal } from "@/app/components/games/RollResultQuickModal";
import type { GameDetail } from "@/app/lib/types/game";
import type {
  EnemyInstanceDetailResponse,
  EnemyInstancePatch,
} from "@/lib/api/enemyInstances";
import type {
  AttackModalState,
  DefenceModalState,
  QuickResultState,
} from "../useEnemyInstancePage";
import { EnemyInstanceZeroHpModal } from "./EnemyInstanceZeroHpModal";

type EnemyInstanceModalsProps = {
  gameId: string;
  enemy: EnemyInstanceDetailResponse;
  gameDetail: GameDetail | null;
  enemyRollCtx?: { instanceId: string; name: string };
  loadSilent: () => void | Promise<unknown>;
  defenceModal: DefenceModalState;
  setDefenceModal: (v: DefenceModalState) => void;
  attackModal: AttackModalState;
  setAttackModal: (v: AttackModalState) => void;
  quickResult: QuickResultState;
  setQuickResult: (v: QuickResultState) => void;
  diceRollerOpen: boolean;
  setDiceRollerOpen: (v: boolean) => void;
  editOpen: boolean;
  setEditOpen: (v: boolean) => void;
  zeroHpPromptOpen: boolean;
  setZeroHpPromptOpen: (v: boolean) => void;
  initiativeListOpen: boolean;
  setInitiativeListOpen: (v: boolean) => void;
  spendReaction: () => void;
  applyEnemyPatch: (
    build: (prev: EnemyInstanceDetailResponse) => EnemyInstancePatch
  ) => void;
};

export function EnemyInstanceModals({
  gameId,
  enemy,
  gameDetail,
  enemyRollCtx,
  loadSilent,
  defenceModal,
  setDefenceModal,
  attackModal,
  setAttackModal,
  quickResult,
  setQuickResult,
  diceRollerOpen,
  setDiceRollerOpen,
  editOpen,
  setEditOpen,
  zeroHpPromptOpen,
  setZeroHpPromptOpen,
  initiativeListOpen,
  setInitiativeListOpen,
  spendReaction,
  applyEnemyPatch,
}: EnemyInstanceModalsProps) {
  return (
    <>
      <DefenceRollModal
        isOpen={defenceModal != null}
        onClose={() => setDefenceModal(null)}
        defenceDice={defenceModal?.dice ?? 0}
        title={defenceModal?.title ?? ""}
        reactionDisabled={enemy.reactionsRemaining <= 0}
        onRollReaction={spendReaction}
        gameId={gameId}
        enemyInstanceRoll={enemyRollCtx}
      />

      <AttackRollModal
        isOpen={attackModal != null}
        onClose={() => setAttackModal(null)}
        attackType={attackModal?.attackType ?? "melee"}
        options={attackModal?.options ?? []}
        gameId={gameId}
        enemyInstanceRoll={enemyRollCtx}
      />

      <RollResultQuickModal
        isOpen={quickResult != null}
        onClose={() => setQuickResult(null)}
        title={quickResult?.title ?? ""}
        subtitle={quickResult?.subtitle}
        results={quickResult?.results ?? []}
        highlightMode={quickResult?.highlightMode ?? "d10"}
        total={quickResult?.total}
        totalLabel={quickResult?.totalLabel}
      />

      <EnemyInstanceDiceRollerModal
        isOpen={diceRollerOpen}
        onClose={() => setDiceRollerOpen(false)}
        gameId={gameId}
        enemyInstanceId={enemy.id}
        enemyName={enemy.name}
      />

      <EditEnemyInstanceModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        gameId={gameId}
        enemy={enemy}
        onSaved={loadSilent}
      />

      <EnemyInstanceZeroHpModal
        isOpen={zeroHpPromptOpen}
        onClose={() => setZeroHpPromptOpen(false)}
        applyEnemyPatch={applyEnemyPatch}
      />

      {gameDetail ? (
        <InitiativeOrderModal
          isOpen={initiativeListOpen}
          onClose={() => setInitiativeListOpen(false)}
          gameDetails={[gameDetail]}
          initialGameId={gameId}
        />
      ) : null}
    </>
  );
}
