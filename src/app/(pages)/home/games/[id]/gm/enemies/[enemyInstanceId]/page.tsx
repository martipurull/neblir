"use client";

import ErrorState from "@/app/components/shared/ErrorState";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import { EnemyInstanceActionListSection } from "./_components/EnemyInstanceActionListSection";
import { EnemyInstanceAttackSection } from "./_components/EnemyInstanceAttackSection";
import { EnemyInstanceDefenceSection } from "./_components/EnemyInstanceDefenceSection";
import { EnemyInstanceHeader } from "./_components/EnemyInstanceHeader";
import { EnemyInstanceHpCard } from "./_components/EnemyInstanceHpCard";
import { EnemyInstanceInitiativeCard } from "./_components/EnemyInstanceInitiativeCard";
import { EnemyInstanceModals } from "./_components/EnemyInstanceModals";
import { EnemyInstanceToolbar } from "./_components/EnemyInstanceToolbar";
import { useEnemyInstancePage } from "./useEnemyInstancePage";

export default function EnemyInstancePage() {
  const page = useEnemyInstancePage();

  if (page.loading) {
    return (
      <PageSection>
        <LoadingState text="Loading enemy instance..." />
      </PageSection>
    );
  }
  if (!page.enemy) {
    return (
      <PageSection>
        <ErrorState
          message={page.loadError ?? "Enemy instance not found"}
          onRetry={() => void page.load()}
          retryLabel="Retry"
        />
      </PageSection>
    );
  }

  const enemy = page.enemy;
  const canDamage = enemy.currentHealth > 0;
  const hpPct =
    enemy.maxHealth > 0
      ? Math.round((100 * enemy.currentHealth) / enemy.maxHealth)
      : 0;

  return (
    <PageSection>
      <div className="flex flex-col gap-5">
        {page.banner ? (
          <p className="rounded border border-neblirDanger-200 bg-neblirDanger-200/35 px-3 py-2 text-sm text-neblirDanger-600">
            {page.banner}
          </p>
        ) : null}

        <EnemyInstanceHeader
          enemy={enemy}
          imageUrl={page.imageUrls[enemy.id]}
          onEdit={() => page.setEditOpen(true)}
        />

        <EnemyInstanceToolbar
          enemy={enemy}
          gameDetail={page.gameDetail}
          hasInitiativeEntry={page.hasInitiativeEntry}
          initiativeBusy={page.initiativeBusy}
          onOpenDiceRoller={() => page.setDiceRollerOpen(true)}
          onResetReactions={() =>
            page.applyEnemyPatch((cur) => ({
              reactionsRemaining: cur.reactionsPerRound,
            }))
          }
          onRollInitiative={() => void page.handleInitiativeRoll()}
        />

        {page.gameDetail ? (
          <EnemyInstanceInitiativeCard
            initiativeEntry={page.initiativeEntry}
            initiativeAdjustBusy={page.initiativeAdjustBusy}
            onOpenInitiativeList={() => page.setInitiativeListOpen(true)}
            onAdjustTotal={(d) => void page.handleAdjustInitiativeInGame(d)}
          />
        ) : null}

        <EnemyInstanceHpCard
          enemy={enemy}
          hpStyles={page.hpStyles}
          hpPct={hpPct}
          canDamage={canDamage}
          applyEnemyPatch={page.applyEnemyPatch}
          applyHealthDelta={page.applyHealthDelta}
          spendReaction={page.spendReaction}
        />

        <EnemyInstanceDefenceSection
          rows={page.defenceRows}
          onOpenModal={(r) =>
            page.setDefenceModal({ title: r.title, dice: r.dice })
          }
        />

        <EnemyInstanceAttackSection
          rows={page.attackRows}
          onOpenModal={(attackType, options) =>
            page.setAttackModal({ attackType, options })
          }
        />

        <EnemyInstanceActionListSection
          title="Actions"
          emptyMessage="No actions."
          actions={enemy.actions}
          onRollToHit={page.runActionToHit}
          onRollDamage={page.runActionDamage}
        />

        <EnemyInstanceActionListSection
          title="Additional actions"
          emptyMessage="No additional actions."
          actions={enemy.additionalActions}
          onRollToHit={page.runActionToHit}
          onRollDamage={page.runActionDamage}
        />
      </div>

      <EnemyInstanceModals
        gameId={page.gameId}
        enemy={enemy}
        gameDetail={page.gameDetail}
        enemyRollCtx={page.enemyRollCtx}
        loadSilent={() => void page.load({ silent: true })}
        defenceModal={page.defenceModal}
        setDefenceModal={page.setDefenceModal}
        attackModal={page.attackModal}
        setAttackModal={page.setAttackModal}
        quickResult={page.quickResult}
        setQuickResult={page.setQuickResult}
        diceRollerOpen={page.diceRollerOpen}
        setDiceRollerOpen={page.setDiceRollerOpen}
        editOpen={page.editOpen}
        setEditOpen={page.setEditOpen}
        zeroHpPromptOpen={page.zeroHpPromptOpen}
        setZeroHpPromptOpen={page.setZeroHpPromptOpen}
        initiativeListOpen={page.initiativeListOpen}
        setInitiativeListOpen={page.setInitiativeListOpen}
        spendReaction={page.spendReaction}
        applyEnemyPatch={page.applyEnemyPatch}
      />
    </PageSection>
  );
}
