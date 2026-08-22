"use client";

import { EnemyDetailsModal } from "@/app/components/games/EnemyDetailsModal";
import {
  SpawnEnemyInstancesModal,
  type SpawnEnemyInstancesSource,
} from "@/app/components/games/SpawnEnemyInstancesModal";
import { Button } from "@/app/components/shared/Button";
import { DangerConfirmModal } from "@/app/components/shared/DangerConfirmModal";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { RemoteAvatar } from "@/app/components/shared/RemoteAvatar";
import { TextField } from "@/app/components/shared/TextField";
import type { GameDetail } from "@/app/lib/types/game";
import {
  deleteCustomEnemy,
  downloadCustomEnemy,
} from "@/lib/api/customEnemies";
import { useImageUrls } from "@/hooks/use-image-urls";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useMemo, useState } from "react";

type BrowseCustomEnemiesModalProps = {
  isOpen: boolean;
  game: GameDetail;
  gameName: string;
  onClose: () => void;
  onEdit: (customEnemyId: string) => void;
  onSuccess?: () => void | Promise<void>;
};

export function BrowseCustomEnemiesModal(props: BrowseCustomEnemiesModalProps) {
  if (!props.isOpen) return null;
  return <BrowseCustomEnemiesModalContent {...props} />;
}

function BrowseCustomEnemiesModalContent({
  game,
  gameName,
  onClose,
  onEdit,
  onSuccess,
}: BrowseCustomEnemiesModalProps) {
  const enemies = useMemo(() => game.customEnemies ?? [], [game.customEnemies]);
  const imageUrls = useImageUrls(
    enemies.map((e) => ({ id: e.id, imageKey: e.imageKey ?? null }))
  );
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [spawnSource, setSpawnSource] =
    useState<SpawnEnemyInstancesSource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [detailEnemy, setDetailEnemy] = useState<{
    id: string;
    name: string;
    imageKey?: string | null;
  } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...enemies].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
    if (!q) return sorted;
    return sorted.filter((enemy) => enemy.name.toLowerCase().includes(q));
  }, [enemies, search]);

  const cancelDelete = () => {
    if (deleteSubmitting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    setBusyId(deleteTarget.id);
    try {
      await deleteCustomEnemy(game.id, deleteTarget.id);
      await Promise.resolve(onSuccess?.());
      setDeleteTarget(null);
      setDetailEnemy((curr) => (curr?.id === deleteTarget.id ? null : curr));
    } catch (error) {
      setDeleteError(
        getUserSafeErrorMessage(error, "Could not delete this enemy.")
      );
    } finally {
      setDeleteSubmitting(false);
      setBusyId(null);
    }
  };

  return (
    <>
      <ModalShell
        isOpen
        onClose={onClose}
        title={`Browse custom enemies — ${gameName}`}
        titleId="browse-custom-enemies-title"
        maxWidthClass="max-w-3xl"
      >
        <p className="mt-1 text-xs text-white/70">
          Custom enemy templates for this game. Edit, export, spawn instances,
          or delete from here.
        </p>
        <div className="mt-3">
          <TextField
            id="browse-custom-enemies-search"
            type="search"
            variant="dark"
            density="compact"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search custom enemies…"
            aria-label="Search custom enemies"
          />
        </div>
        <div className="mt-3 max-h-[55vh] overflow-y-auto rounded border border-white/20 p-2">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-sm text-white/75">
              {enemies.length === 0
                ? "No custom enemies yet. Browse official enemies, create one, or import from CSV/JSON."
                : "No custom enemies match your search."}
            </p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((enemy) => (
                <li
                  key={enemy.id}
                  className="flex flex-col gap-2 rounded border border-white/10 px-2 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <Button
                    type="button"
                    variant="modalBrowseListRow"
                    fullWidth={false}
                    className="min-w-0 flex-1"
                    onClick={() =>
                      setDetailEnemy({
                        id: enemy.id,
                        name: enemy.name,
                        imageKey: enemy.imageKey,
                      })
                    }
                  >
                    <RemoteAvatar
                      imageUrl={imageUrls[enemy.id]}
                      imageKey={enemy.imageKey}
                      alt={`${enemy.name} avatar`}
                      size={40}
                      className="h-10 w-10"
                    />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate font-medium">
                        {enemy.name}
                      </span>
                      <span className="block truncate text-xs text-white/65">
                        (init {enemy.initiativeModifier >= 0 ? "+" : ""}
                        {enemy.initiativeModifier}
                        {enemy.health != null ? ` · HP ${enemy.health}` : ""}
                        {enemy.speed != null ? ` · Spd ${enemy.speed}` : ""})
                      </span>
                    </span>
                  </Button>
                  <div className="flex shrink-0 flex-wrap gap-1.5 sm:justify-end">
                    <Button
                      type="button"
                      variant="secondaryOutlineXs"
                      fullWidth={false}
                      disabled={busyId === enemy.id}
                      onClick={() => onEdit(enemy.id)}
                      className="!px-2 !py-1 !text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="secondaryOutlineXs"
                      fullWidth={false}
                      disabled={busyId === enemy.id}
                      onClick={() =>
                        void downloadCustomEnemy(
                          game.id,
                          enemy.id,
                          "csv"
                        ).catch((err) =>
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
                      disabled={busyId === enemy.id}
                      onClick={() =>
                        void downloadCustomEnemy(
                          game.id,
                          enemy.id,
                          "json"
                        ).catch((err) =>
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
                      disabled={busyId === enemy.id}
                      onClick={() =>
                        setSpawnSource({
                          sourceType: "custom",
                          sourceCustomEnemyId: enemy.id,
                          defaultName: enemy.name,
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
                      disabled={busyId === enemy.id}
                      onClick={() => {
                        setDeleteTarget({ id: enemy.id, name: enemy.name });
                        setDeleteError(null);
                      }}
                      className="!px-2 !py-1 !text-xs"
                    >
                      {busyId === enemy.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="secondaryOutlineXs" onClick={onClose}>
            Close
          </Button>
        </div>
      </ModalShell>

      <DangerConfirmModal
        isOpen={deleteTarget != null}
        title={`Delete "${deleteTarget?.name ?? ""}"?`}
        description={
          <>
            Remove this enemy from your collection for this campaign. Any
            instances you spawned from this template will be removed as well.
            This cannot be undone.
          </>
        }
        confirmLabel="Delete enemy"
        cancelLabel="Cancel"
        isSubmitting={deleteSubmitting}
        errorMessage={deleteError}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />

      <SpawnEnemyInstancesModal
        isOpen={spawnSource != null}
        gameId={game.id}
        source={spawnSource}
        onClose={() => setSpawnSource(null)}
        onSuccess={() => {
          void onSuccess?.();
        }}
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
    </>
  );
}
