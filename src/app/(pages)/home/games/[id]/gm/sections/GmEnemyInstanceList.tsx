import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { DangerConfirmModal } from "@/app/components/shared/DangerConfirmModal";
import { RemoteAvatar } from "@/app/components/shared/RemoteAvatar";
import { instanceLabelOf } from "@/app/lib/enemyInstanceLabel";
import { withRemovedEnemyInstances } from "@/app/lib/gameEnemyInstanceOptimistic";
import type { GameDetail } from "@/app/lib/types/game";
import { hasCombatantInitiativeEntry } from "@/app/lib/gmCombatantInitiative";
import { isPrivateGameCharacterLink } from "@/app/lib/roll-privacy";
import {
  deleteEnemyInstances,
  updateEnemyInstance,
} from "@/lib/api/enemyInstances";
import { useImageUrls } from "@/hooks/use-image-urls";
import { useQueuedGmCombatantInitiative } from "@/hooks/use-queued-gm-combatant-initiative";
import Link from "next/link";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import {
  linkVisibilityBadgeClassName,
  linkVisibilityLabel,
} from "@/app/lib/visibilityBadge";
import {
  enemyStatusBadgeClass,
  enemyStatusLabel,
  type EnemyInstanceStatus,
} from "@/app/(pages)/home/games/[id]/gm/enemies/[enemyInstanceId]/enemyInstanceUtils";
import { GmCombatHpDisplay } from "./GmCombatHpDisplay";
import { GmInitiativeRollButton } from "./GmInitiativeRollButton";
import { useCallback, useState } from "react";

type EnemyInstanceRow = NonNullable<GameDetail["enemyInstances"]>[number];

type RemoveTarget = {
  ids: string[];
  title: string;
  confirmLabel: string;
};

type GmEnemyInstanceListProps = {
  game: GameDetail;
  onMutate: () => void | Promise<void>;
  applyOptimisticGameUpdate: (
    optimistic: GameDetail,
    request: () => Promise<GameDetail>
  ) => Promise<unknown>;
  onInitiativeRolled: (game: GameDetail) => void | Promise<void>;
};

export function GmEnemyInstanceList({
  game,
  onMutate,
  applyOptimisticGameUpdate,
  onInitiativeRolled,
}: GmEnemyInstanceListProps) {
  const instances = game.enemyInstances ?? [];
  const imageUrls = useImageUrls(
    instances.map((i) => ({ id: i.id, imageKey: i.imageKey ?? null }))
  );
  const [busyInstanceId, setBusyInstanceId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const {
    isPending,
    enqueueRoll,
    error: instanceRollError,
  } = useQueuedGmCombatantInitiative({
    game,
    onRolled: onInitiativeRolled,
  });

  const selectedIdsOnTable = instances
    .map((inst) => inst.id)
    .filter((id) => selectedIds.has(id));

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const cancelRemove = () => {
    if (removeSubmitting) return;
    setRemoveTarget(null);
    setRemoveError(null);
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    const ids = removeTarget.ids;
    setRemoveSubmitting(true);
    setRemoveError(null);
    if (ids.length === 1) setBusyInstanceId(ids[0] ?? null);
    try {
      const optimistic = withRemovedEnemyInstances(game, ids);
      await applyOptimisticGameUpdate(optimistic, async () => {
        await deleteEnemyInstances(game.id, ids);
        return optimistic;
      });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
      setRemoveTarget(null);
      setRemoveError(null);
    } catch (error) {
      setRemoveError(
        getUserSafeErrorMessage(
          error,
          ids.length === 1
            ? "Could not remove this instance."
            : "Could not remove these instances."
        )
      );
    } finally {
      setRemoveSubmitting(false);
      setBusyInstanceId(null);
    }
  };

  const handleRollInstance = useCallback(
    async (instance: EnemyInstanceRow) => {
      await enqueueRoll({
        combatantType: "ENEMY",
        combatantId: instance.id,
        combatantName: instanceLabelOf(instance),
        initiativeModifier: instance.initiativeModifier ?? 0,
        isPrivate: isPrivateGameCharacterLink(instance.isPublic),
        source: "gmEnemyList",
      });
    },
    [enqueueRoll]
  );

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-black/90">
          Active enemy instances
          {instances.length > 0 ? (
            <span className="ml-1.5 font-medium tabular-nums text-black/55">
              ({instances.length})
            </span>
          ) : null}
        </h4>
        {instances.length > 0 ? (
          <Button
            type="button"
            variant="semanticDangerOutline"
            fullWidth={false}
            disabled={selectedIdsOnTable.length === 0 || removeSubmitting}
            className="!px-2 !py-1 !text-xs"
            onClick={() => {
              const selectedRows = instances.filter((row) =>
                selectedIds.has(row.id)
              );
              const count = selectedRows.length;
              const first = selectedRows[0];
              if (first == null) return;
              setRemoveTarget({
                ids: selectedRows.map((row) => row.id),
                title:
                  count === 1
                    ? `Remove "${instanceLabelOf(first)}"?`
                    : `Remove ${count} enemy instances?`,
                confirmLabel:
                  count === 1 ? "Remove instance" : "Remove instances",
              });
              setRemoveError(null);
            }}
          >
            Remove
          </Button>
        ) : null}
      </div>
      {instances.length === 0 ? (
        <p className="mt-1 text-sm text-black/70">
          No active instances yet. Spawn from a custom enemy template, or browse
          official enemies and use &quot;Spawn instance(s)&quot; without copying
          a template.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-black/15 border-b border-black/15 text-sm text-black">
          {instances.map((inst) => {
            const isPublic = inst.isPublic !== false;
            const visibilityLabel = linkVisibilityLabel(isPublic);
            const instanceHref = `/home/games/${game.id}/gm/enemies/${inst.id}`;
            const status = inst.status as EnemyInstanceStatus;
            const instanceBusy =
              busyInstanceId === inst.id || isPending("ENEMY", inst.id);
            const isRolling = isPending("ENEMY", inst.id);
            const instanceLabel = instanceLabelOf(inst);
            return (
              <li
                key={inst.id}
                className="relative flex flex-col gap-2 py-2.5 transition-colors hover:bg-black/[0.04] sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  href={instanceHref}
                  className="absolute inset-0 z-0 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                  aria-label={`Open ${instanceLabel}`}
                />
                <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className="shrink-0"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedIds.has(inst.id)}
                      onChange={(checked) => toggleSelected(inst.id, checked)}
                      disabled={removeSubmitting}
                      label={
                        <span className="sr-only">Select {instanceLabel}</span>
                      }
                    />
                  </div>
                  <div className="pointer-events-none flex min-w-0 flex-1 items-center gap-3">
                    <RemoteAvatar
                      imageUrl={imageUrls[inst.id]}
                      imageKey={inst.imageKey}
                      alt=""
                      size={44}
                      className="h-11 w-11"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="truncate text-base font-medium">
                          {instanceLabel}
                        </p>
                        <span className={enemyStatusBadgeClass(status)}>
                          {enemyStatusLabel(status)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <GmCombatHpDisplay
                          currentHealth={inst.currentHealth}
                          maxHealth={inst.maxHealth}
                        />
                        <p className="text-xs tabular-nums text-black/70">
                          Reactions {inst.reactionsRemaining}/
                          {inst.reactionsPerRound}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative z-10 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`${linkVisibilityBadgeClassName(isPublic)} pointer-events-none`}
                  >
                    {visibilityLabel}
                  </span>
                  <Button
                    type="button"
                    variant="secondaryOutlineXs"
                    fullWidth={false}
                    disabled={instanceBusy}
                    className="!px-2 !py-1 !text-xs"
                    onClick={() => {
                      setBusyInstanceId(inst.id);
                      void updateEnemyInstance(game.id, inst.id, {
                        reactionsRemaining: inst.reactionsPerRound,
                      })
                        .then(async () => onMutate())
                        .finally(() => setBusyInstanceId(null));
                    }}
                  >
                    Reset reactions
                  </Button>
                  <GmInitiativeRollButton
                    hasRolled={hasCombatantInitiativeEntry(
                      game,
                      "ENEMY",
                      inst.id
                    )}
                    busy={isRolling}
                    modifier={inst.initiativeModifier ?? 0}
                    disabled={instanceBusy && !isRolling}
                    className="!px-2 !py-1 !text-xs"
                    onClick={() => void handleRollInstance(inst)}
                  />
                  <Button
                    type="button"
                    variant="semanticDangerOutline"
                    fullWidth={false}
                    disabled={instanceBusy || removeSubmitting}
                    className="!px-2 !py-1 !text-xs"
                    onClick={() => {
                      setRemoveTarget({
                        ids: [inst.id],
                        title: `Remove "${instanceLabel}"?`,
                        confirmLabel: "Remove instance",
                      });
                      setRemoveError(null);
                    }}
                  >
                    {busyInstanceId === inst.id ? "Removing…" : "Remove"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {instanceRollError ? (
        <p className="mt-2 text-sm text-neblirDanger-400">
          {instanceRollError}
        </p>
      ) : null}

      <DangerConfirmModal
        isOpen={removeTarget != null}
        title={removeTarget?.title ?? ""}
        description={
          <>
            Remove{" "}
            {removeTarget != null && removeTarget.ids.length > 1
              ? "these instances"
              : "this instance"}{" "}
            from the campaign. Matching initiative entries are removed too. This
            cannot be undone.
          </>
        }
        confirmLabel={removeTarget?.confirmLabel ?? "Remove instance"}
        confirmSubmittingLabel="Removing..."
        cancelLabel="Cancel"
        isSubmitting={removeSubmitting}
        errorMessage={removeError}
        onCancel={cancelRemove}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
