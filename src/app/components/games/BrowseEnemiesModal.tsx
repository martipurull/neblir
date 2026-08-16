"use client";

import { EnemyDetailsView } from "@/app/components/games/EnemyDetailsView";
import { Button } from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { RemoteAvatar } from "@/app/components/shared/RemoteAvatar";
import { enemyTemplateToDetailsModel } from "@/app/lib/enemyDetailsView";
import { useImageUrls } from "@/hooks/use-image-urls";
import { SpawnEnemyInstancesModal } from "@/app/components/games/SpawnEnemyInstancesModal";
import { addOfficialEnemyToGame, getEnemies } from "@/lib/api/enemies";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import type { EnemyResponse } from "@/app/lib/types/enemy";
import { useEffect, useMemo, useState } from "react";

type BrowseEnemiesModalProps = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
};

export function BrowseEnemiesModal({
  isOpen,
  gameId,
  gameName,
  onClose,
  onSuccess,
}: BrowseEnemiesModalProps) {
  const [enemies, setEnemies] = useState<EnemyResponse[]>([]);
  const [selectedEnemyId, setSelectedEnemyId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [spawnOfficialId, setSpawnOfficialId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSpawnOfficialId(null);
      return;
    }
    setLoading(true);
    setError(null);
    void getEnemies()
      .then((rows) => {
        setEnemies(rows);
        setSelectedEnemyId((curr) => curr || rows[0]?.id || "");
      })
      .catch((e) =>
        setError(getUserSafeErrorMessage(e, "Failed to load enemies"))
      )
      .finally(() => setLoading(false));
  }, [isOpen]);

  const imageUrls = useImageUrls(
    enemies.map((e) => ({ id: e.id, imageKey: e.imageKey ?? null }))
  );

  const selected = useMemo(
    () => enemies.find((e) => e.id === selectedEnemyId) ?? null,
    [enemies, selectedEnemyId]
  );

  const spawnSource =
    spawnOfficialId != null && selected?.id === spawnOfficialId
      ? {
          sourceType: "official" as const,
          sourceOfficialEnemyId: selected.id,
          defaultName: selected.name,
        }
      : null;

  const handleAdd = async () => {
    if (!selected) return;
    setSubmittingId(selected.id);
    setError(null);
    try {
      await addOfficialEnemyToGame(gameId, selected.id);
      await onSuccess?.();
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to add enemy"));
    } finally {
      setSubmittingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={() => {
        setSpawnOfficialId(null);
        onClose();
      }}
      title={`Browse enemies — ${gameName}`}
      titleId="browse-enemies-title"
      maxWidthClass="max-w-4xl"
    >
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="max-h-[60vh] overflow-y-auto rounded border border-white/20 p-2">
          {loading ? (
            <p className="px-2 py-3 text-sm text-white/75">
              Loading enemies...
            </p>
          ) : enemies.length === 0 ? (
            <p className="px-2 py-3 text-sm text-white/75">
              No enemies available.
            </p>
          ) : (
            <ul className="space-y-1">
              {enemies.map((enemy) => (
                <li key={enemy.id}>
                  <Button
                    type="button"
                    variant={
                      selectedEnemyId === enemy.id
                        ? "modalBrowseListRowSelected"
                        : "modalBrowseListRow"
                    }
                    fullWidth={false}
                    onClick={() => setSelectedEnemyId(enemy.id)}
                    className="w-full"
                  >
                    <RemoteAvatar
                      imageUrl={imageUrls[enemy.id]}
                      imageKey={enemy.imageKey}
                      alt=""
                      size={32}
                      className="h-8 w-8"
                    />
                    <span className="truncate">{enemy.name}</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto rounded border border-white/20 p-3">
          {!selected ? (
            <p className="text-sm text-white/75">
              Select an enemy to view details.
            </p>
          ) : (
            <div className="space-y-3 text-sm text-white">
              <div className="flex items-center gap-3">
                <RemoteAvatar
                  imageUrl={imageUrls[selected.id]}
                  imageKey={selected.imageKey}
                  alt={`${selected.name} avatar`}
                  size={48}
                  className="h-12 w-12"
                />
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {selected.name}
                  </h3>
                  <p className="text-xs text-white/70">
                    Init {selected.initiativeModifier >= 0 ? "+" : ""}
                    {selected.initiativeModifier} · HP {selected.health} · Spd{" "}
                    {selected.speed}
                  </p>
                </div>
              </div>
              <EnemyDetailsView
                details={enemyTemplateToDetailsModel(selected)}
              />
            </div>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-neblirDanger-300">{error}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondaryOutlineXs" onClick={onClose}>
          Close
        </Button>
        <Button
          type="button"
          variant="secondaryOutlineXs"
          disabled={!selected || loading || submittingId != null}
          onClick={() => selected && setSpawnOfficialId(selected.id)}
        >
          Spawn instance(s)
        </Button>
        <Button
          type="button"
          variant="semanticWarningOutline"
          disabled={!selected || loading || submittingId != null}
          onClick={() => void handleAdd()}
        >
          {submittingId ? "Adding..." : "Add to this game"}
        </Button>
      </div>

      <SpawnEnemyInstancesModal
        isOpen={spawnSource != null}
        gameId={gameId}
        source={spawnSource}
        onClose={() => setSpawnOfficialId(null)}
        onSuccess={async () => {
          await onSuccess?.();
        }}
      />
    </ModalShell>
  );
}
