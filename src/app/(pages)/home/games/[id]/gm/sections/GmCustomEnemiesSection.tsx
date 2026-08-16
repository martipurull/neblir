import { EnemyDetailsModal } from "@/app/components/games/EnemyDetailsModal";
import {
  SpawnEnemyInstancesModal,
  type SpawnEnemyInstancesSource,
} from "@/app/components/games/SpawnEnemyInstancesModal";
import { Button } from "@/app/components/shared/Button";
import { DangerConfirmModal } from "@/app/components/shared/DangerConfirmModal";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { RemoteAvatar } from "@/app/components/shared/RemoteAvatar";
import type { GameDetail } from "@/app/lib/types/game";
import { hasCombatantInitiativeEntry } from "@/app/lib/gmCombatantInitiative";
import { isPrivateGameCharacterLink } from "@/app/lib/roll-privacy";
import {
  deleteCustomEnemy,
  downloadCustomEnemy,
  downloadGameCustomEnemies,
} from "@/lib/api/customEnemies";
import {
  deleteEnemyInstance,
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
import { GmSectionTitle } from "./GmSectionTitle";
import { useCallback, useState } from "react";

type GmCustomEnemiesSectionProps = {
  game: GameDetail;
  onCreate: () => void;
  onOpenBrowse: () => void;
  onEdit: (customEnemyId: string) => void;
  onOpenImport: () => void;
  onOpenCopy: () => void;
  onMutate: () => void | Promise<void>;
  onInitiativeRolled: (game: GameDetail) => void | Promise<void>;
};

export function GmCustomEnemiesSection({
  game,
  onCreate,
  onOpenBrowse,
  onEdit,
  onOpenImport,
  onOpenCopy,
  onMutate,
  onInitiativeRolled,
}: GmCustomEnemiesSectionProps) {
  const enemies = game.customEnemies ?? [];
  const instances = game.enemyInstances ?? [];
  const imageUrls = useImageUrls([
    ...enemies.map((e) => ({ id: e.id, imageKey: e.imageKey ?? null })),
    ...instances.map((i) => ({ id: i.id, imageKey: i.imageKey ?? null })),
  ]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyInstanceId, setBusyInstanceId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);
  const [spawnSource, setSpawnSource] =
    useState<SpawnEnemyInstancesSource | null>(null);
  const [deleteCollectionTarget, setDeleteCollectionTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteCollectionSubmitting, setDeleteCollectionSubmitting] =
    useState(false);
  const [deleteCollectionError, setDeleteCollectionError] = useState<
    string | null
  >(null);
  const [removeInstanceTarget, setRemoveInstanceTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [removeInstanceSubmitting, setRemoveInstanceSubmitting] =
    useState(false);
  const [removeInstanceError, setRemoveInstanceError] = useState<string | null>(
    null
  );
  const [instancesExpanded, setInstancesExpanded] = useState(false);
  const [detailEnemy, setDetailEnemy] = useState<{
    id: string;
    name: string;
    imageKey?: string | null;
  } | null>(null);
  const {
    isPending,
    enqueueRoll,
    error: instanceRollError,
  } = useQueuedGmCombatantInitiative({
    game,
    onRolled: onInitiativeRolled,
  });

  const cancelDeleteCollectionModal = () => {
    if (deleteCollectionSubmitting) return;
    setDeleteCollectionTarget(null);
    setDeleteCollectionError(null);
  };

  const confirmDeleteCollectionTemplate = async () => {
    if (!deleteCollectionTarget) return;
    setDeleteCollectionSubmitting(true);
    setDeleteCollectionError(null);
    setBusyId(deleteCollectionTarget.id);
    try {
      await deleteCustomEnemy(game.id, deleteCollectionTarget.id);
      await Promise.resolve(onMutate());
      setDeleteCollectionTarget(null);
      setDeleteCollectionError(null);
    } catch (error) {
      setDeleteCollectionError(
        getUserSafeErrorMessage(error, "Could not delete this enemy.")
      );
    } finally {
      setDeleteCollectionSubmitting(false);
      setBusyId(null);
    }
  };

  const cancelRemoveInstanceModal = () => {
    if (removeInstanceSubmitting) return;
    setRemoveInstanceTarget(null);
    setRemoveInstanceError(null);
  };

  const confirmRemoveInstance = async () => {
    if (!removeInstanceTarget) return;
    setRemoveInstanceSubmitting(true);
    setRemoveInstanceError(null);
    setBusyInstanceId(removeInstanceTarget.id);
    try {
      await deleteEnemyInstance(game.id, removeInstanceTarget.id);
      await Promise.resolve(onMutate());
      setRemoveInstanceTarget(null);
      setRemoveInstanceError(null);
    } catch (error) {
      setRemoveInstanceError(
        getUserSafeErrorMessage(error, "Could not remove this instance.")
      );
    } finally {
      setRemoveInstanceSubmitting(false);
      setBusyInstanceId(null);
    }
  };

  const handleRollInstance = useCallback(
    async (instance: NonNullable<GameDetail["enemyInstances"]>[number]) => {
      await enqueueRoll({
        combatantType: "ENEMY",
        combatantId: instance.id,
        combatantName: instance.name,
        initiativeModifier: instance.initiativeModifier ?? 0,
        isPrivate: isPrivateGameCharacterLink(instance.isPublic),
        source: "gmEnemyList",
      });
    },
    [enqueueRoll]
  );

  return (
    <InfoCard border>
      <GmSectionTitle>Enemies</GmSectionTitle>
      <p className="mt-1 text-xs text-black/70">
        Add official enemies to this campaign or create your own, then manage,
        export, import, or copy enemies across your games.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onOpenBrowse}
        >
          Browse enemies
        </Button>
        <Button
          type="button"
          variant="primarySm"
          fullWidth={false}
          onClick={onCreate}
        >
          Create custom enemy
        </Button>
        <Button
          type="button"
          variant="secondaryOutlineXs"
          fullWidth={false}
          disabled={busyAll || enemies.length === 0}
          onClick={() => {
            setBusyAll(true);
            void downloadGameCustomEnemies(game.id, "csv")
              .catch((e) =>
                window.alert(e instanceof Error ? e.message : String(e))
              )
              .finally(() => setBusyAll(false));
          }}
        >
          {busyAll ? "Downloading…" : "Download all (CSV)"}
        </Button>
        <Button
          type="button"
          variant="secondaryOutlineXs"
          fullWidth={false}
          disabled={busyAll || enemies.length === 0}
          onClick={() => {
            setBusyAll(true);
            void downloadGameCustomEnemies(game.id, "json")
              .catch((e) =>
                window.alert(e instanceof Error ? e.message : String(e))
              )
              .finally(() => setBusyAll(false));
          }}
        >
          {busyAll ? "Downloading…" : "Download all (JSON)"}
        </Button>
        <Button
          type="button"
          variant="secondaryOutlineXs"
          fullWidth={false}
          onClick={onOpenImport}
        >
          Upload from CSV/JSON
        </Button>
        <Button
          type="button"
          variant="secondaryOutlineXs"
          fullWidth={false}
          onClick={onOpenCopy}
        >
          Copy from another game
        </Button>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-black/90">Game Enemies</h4>
        {enemies.length === 0 ? (
          <p className="mt-1 text-sm text-black/70">
            No enemies in this game yet. Browse official enemies, create one, or
            import from CSV/JSON.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-black/15 border-b border-black/15 text-sm text-black">
            {enemies.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <Button
                  type="button"
                  variant="lightRowHit"
                  fullWidth={false}
                  className="flex min-w-0 flex-1 items-center gap-3"
                  onClick={() =>
                    setDetailEnemy({
                      id: e.id,
                      name: e.name,
                      imageKey: e.imageKey,
                    })
                  }
                >
                  <RemoteAvatar
                    imageUrl={imageUrls[e.id]}
                    imageKey={e.imageKey}
                    alt={`${e.name} avatar`}
                    size={44}
                    className="h-11 w-11"
                  />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate font-medium text-black">
                      {e.name}
                    </span>
                    <span className="block truncate tabular-nums text-xs text-black/70">
                      (init {e.initiativeModifier >= 0 ? "+" : ""}
                      {e.initiativeModifier}
                      {e.health != null ? ` · HP ${e.health}` : ""}
                      {e.speed != null ? ` · Spd ${e.speed}` : ""})
                    </span>
                  </span>
                </Button>
                <div className="flex shrink-0 flex-wrap gap-1.5 sm:justify-end">
                  <Button
                    type="button"
                    variant="secondaryOutlineXs"
                    fullWidth={false}
                    disabled={busyId === e.id}
                    onClick={() => onEdit(e.id)}
                    className="!px-2 !py-1 !text-xs"
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="secondaryOutlineXs"
                    fullWidth={false}
                    disabled={busyId === e.id}
                    onClick={() =>
                      void downloadCustomEnemy(game.id, e.id, "csv").catch(
                        (err) =>
                          window.alert(
                            err instanceof Error ? err.message : String(err)
                          )
                      )
                    }
                    className="!px-2 !py-1 !text-xs"
                  >
                    CSV
                  </Button>
                  <Button
                    type="button"
                    variant="secondaryOutlineXs"
                    fullWidth={false}
                    disabled={busyId === e.id}
                    onClick={() =>
                      void downloadCustomEnemy(game.id, e.id, "json").catch(
                        (err) =>
                          window.alert(
                            err instanceof Error ? err.message : String(err)
                          )
                      )
                    }
                    className="!px-2 !py-1 !text-xs"
                  >
                    JSON
                  </Button>
                  <Button
                    type="button"
                    variant="secondaryOutlineXs"
                    fullWidth={false}
                    disabled={busyId === e.id}
                    onClick={() =>
                      setSpawnSource({
                        sourceType: "custom",
                        sourceCustomEnemyId: e.id,
                        defaultName: e.name,
                      })
                    }
                    className="!px-2 !py-1 !text-xs"
                  >
                    Spawn
                  </Button>
                  <Button
                    type="button"
                    variant="semanticDangerOutline"
                    fullWidth={false}
                    disabled={busyId === e.id}
                    onClick={() => {
                      setDeleteCollectionTarget({ id: e.id, name: e.name });
                      setDeleteCollectionError(null);
                    }}
                    className="!px-2 !py-1 !text-xs"
                  >
                    {busyId === e.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-5">
        <Button
          type="button"
          variant="lightReferenceDisclosure"
          aria-expanded={instancesExpanded}
          onClick={() => setInstancesExpanded((open) => !open)}
        >
          <h4 className="text-sm font-semibold text-black/90">
            Active enemy instances
            {instances.length > 0 ? (
              <span className="ml-1.5 font-medium tabular-nums text-black/55">
                ({instances.length})
              </span>
            ) : null}
          </h4>
          <span
            className="shrink-0 text-xs font-semibold text-black/60"
            aria-hidden
          >
            {instancesExpanded ? "▲" : "▼"}
          </span>
        </Button>
        {instancesExpanded ? (
          instances.length === 0 ? (
            <p className="mt-1 text-sm text-black/70">
              No active instances yet. Spawn from a template, or browse official
              enemies and use &quot;Spawn instance(s)&quot; without copying a
              template.
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
                return (
                  <li
                    key={inst.id}
                    className="relative flex flex-col gap-2 py-2.5 transition-colors hover:bg-black/[0.04] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <Link
                      href={instanceHref}
                      className="absolute inset-0 z-0 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                      aria-label={`Open ${inst.name}`}
                    />
                    <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-3">
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
                            {inst.name}
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
                        disabled={instanceBusy || removeInstanceSubmitting}
                        className="!px-2 !py-1 !text-xs"
                        onClick={() => {
                          setRemoveInstanceTarget({
                            id: inst.id,
                            name: inst.name,
                          });
                          setRemoveInstanceError(null);
                        }}
                      >
                        {busyInstanceId === inst.id ? "Removing…" : "Remove"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        ) : null}
        {instancesExpanded && instanceRollError ? (
          <p className="mt-2 text-sm text-neblirDanger-400">
            {instanceRollError}
          </p>
        ) : null}
      </div>

      <DangerConfirmModal
        isOpen={deleteCollectionTarget != null}
        title={`Delete "${deleteCollectionTarget?.name ?? ""}"?`}
        description={
          <>
            Remove this enemy from your collection for this campaign. Any
            instances you spawned from this template will be removed as well.
            This cannot be undone.
          </>
        }
        confirmLabel="Delete enemy"
        cancelLabel="Cancel"
        isSubmitting={deleteCollectionSubmitting}
        errorMessage={deleteCollectionError}
        onCancel={cancelDeleteCollectionModal}
        onConfirm={confirmDeleteCollectionTemplate}
      />

      <DangerConfirmModal
        isOpen={removeInstanceTarget != null}
        title={`Remove "${removeInstanceTarget?.name ?? ""}"?`}
        description={
          <>
            Remove this active instance from the campaign. If it still appears
            in initiative, clear or adjust the order on the GM page as needed.
            This cannot be undone.
          </>
        }
        confirmLabel="Remove instance"
        confirmSubmittingLabel="Removing..."
        cancelLabel="Cancel"
        isSubmitting={removeInstanceSubmitting}
        errorMessage={removeInstanceError}
        onCancel={cancelRemoveInstanceModal}
        onConfirm={confirmRemoveInstance}
      />

      <SpawnEnemyInstancesModal
        isOpen={spawnSource != null}
        gameId={game.id}
        source={spawnSource}
        onClose={() => setSpawnSource(null)}
        onSuccess={onMutate}
      />

      {detailEnemy ? (
        <EnemyDetailsModal
          key={detailEnemy.id}
          isOpen
          gameId={game.id}
          customEnemyId={detailEnemy.id}
          enemyName={detailEnemy.name}
          imageUrl={imageUrls[detailEnemy.id]}
          imageKey={detailEnemy.imageKey}
          onClose={() => setDetailEnemy(null)}
        />
      ) : null}
    </InfoCard>
  );
}
