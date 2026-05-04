import React, { useState } from "react";
import Button from "@/app/components/shared/Button";
import DangerConfirmModal from "@/app/components/shared/DangerConfirmModal";
import InfoCard from "@/app/components/shared/InfoCard";
import ImageLoadingSkeleton from "@/app/components/shared/ImageLoadingSkeleton";
import type { GameDetail } from "@/app/lib/types/game";
import {
  deleteCustomEnemy,
  downloadCustomEnemyCsv,
  downloadGameCustomEnemiesCsv,
} from "@/lib/api/customEnemies";
import {
  SpawnEnemyInstancesModal,
  type SpawnEnemyInstancesSource,
} from "@/app/components/games/SpawnEnemyInstancesModal";
import {
  deleteEnemyInstance,
  updateEnemyInstance,
} from "@/lib/api/enemyInstances";
import { useImageUrls } from "@/hooks/use-image-urls";
import Image from "next/image";
import Link from "next/link";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { GmSectionTitle } from "./GmSectionTitle";

type GmCustomEnemiesSectionProps = {
  game: GameDetail;
  onCreate: () => void;
  onOpenBrowse: () => void;
  onEdit: (customEnemyId: string) => void;
  onOpenImport: () => void;
  onOpenCopy: () => void;
  onMutate: () => void | Promise<void>;
};

export function GmCustomEnemiesSection({
  game,
  onCreate,
  onOpenBrowse,
  onEdit,
  onOpenImport,
  onOpenCopy,
  onMutate,
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
            void downloadGameCustomEnemiesCsv(game.id)
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
          onClick={onOpenImport}
        >
          Upload from CSV
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
        <h4 className="text-sm font-semibold text-black/90">Custom enemies</h4>
        {enemies.length === 0 ? (
          <p className="mt-1 text-sm text-black/70">
            No enemies in this game yet. Browse official enemies, create one, or
            import from CSV.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-black/15 border-b border-black/15 text-sm text-black">
            {enemies.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex flex-1 items-center gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-paleBlue/20">
                    {imageUrls[e.id] ? (
                      <Image
                        src={imageUrls[e.id] as string}
                        alt={`${e.name} avatar`}
                        width={44}
                        height={44}
                        className="h-11 w-11 object-cover object-top"
                      />
                    ) : imageUrls[e.id] === undefined ? (
                      <ImageLoadingSkeleton
                        variant="avatar"
                        className="h-full w-full [&_svg]:h-11 [&_svg]:w-11"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-black">
                        {e.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-black">{e.name}</p>
                    <p className="truncate tabular-nums text-xs text-black/70">
                      (init {e.initiativeModifier >= 0 ? "+" : ""}
                      {e.initiativeModifier}
                      {e.health != null ? ` · HP ${e.health}` : ""}
                      {e.speed != null ? ` · Spd ${e.speed}` : ""})
                    </p>
                  </div>
                </div>
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
                      void downloadCustomEnemyCsv(game.id, e.id).catch((err) =>
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
        <h4 className="text-sm font-semibold text-black/90">
          Active enemy instances
        </h4>
        {instances.length === 0 ? (
          <p className="mt-1 text-sm text-black/70">
            No active instances yet. Spawn from a template, or browse official
            enemies and use &quot;Spawn instance(s)&quot; without copying a
            template.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-black/15 border-b border-black/15 text-sm text-black">
            {instances.map((inst) => (
              <li
                key={inst.id}
                className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex flex-1 items-center gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-paleBlue/20">
                    {imageUrls[inst.id] ? (
                      <Image
                        src={imageUrls[inst.id] as string}
                        alt={`${inst.name} avatar`}
                        width={44}
                        height={44}
                        className="h-11 w-11 object-cover object-top"
                      />
                    ) : imageUrls[inst.id] === undefined ? (
                      <ImageLoadingSkeleton
                        variant="avatar"
                        className="h-full w-full [&_svg]:h-11 [&_svg]:w-11"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-black">
                        {inst.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{inst.name}</p>
                    <p className="text-xs tabular-nums text-black/70">
                      HP {inst.currentHealth}/{inst.maxHealth} · Reactions{" "}
                      {inst.reactionsRemaining}/{inst.reactionsPerRound} ·{" "}
                      {inst.status}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Link
                    href={`/home/games/${game.id}/gm/enemies/${inst.id}`}
                    className="rounded border border-black/40 px-2 py-1 text-xs font-medium text-black hover:bg-black/5"
                  >
                    Manage
                  </Link>
                  <Button
                    type="button"
                    variant="secondaryOutlineXs"
                    fullWidth={false}
                    disabled={busyInstanceId === inst.id}
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
                  <Button
                    type="button"
                    variant="semanticDangerOutline"
                    fullWidth={false}
                    disabled={
                      busyInstanceId === inst.id || removeInstanceSubmitting
                    }
                    className="!px-2 !py-1 !text-xs"
                    onClick={() => {
                      setRemoveInstanceTarget({ id: inst.id, name: inst.name });
                      setRemoveInstanceError(null);
                    }}
                  >
                    {busyInstanceId === inst.id ? "Removing…" : "Remove"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
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
    </InfoCard>
  );
}
