"use client";

import Button from "@/app/components/shared/Button";
import ImageLoadingSkeleton from "@/app/components/shared/ImageLoadingSkeleton";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { useImageUrls } from "@/hooks/use-image-urls";
import { SpawnEnemyInstancesModal } from "@/app/components/games/SpawnEnemyInstancesModal";
import { addOfficialEnemyToGame, getEnemies } from "@/lib/api/enemies";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import type { EnemyResponse } from "@/app/lib/types/enemy";
import Image from "next/image";
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
                  <button
                    type="button"
                    onClick={() => setSelectedEnemyId(enemy.id)}
                    className={[
                      "flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm transition-colors",
                      selectedEnemyId === enemy.id
                        ? "bg-paleBlue/20 text-white"
                        : "text-white/90 hover:bg-paleBlue/10",
                    ].join(" ")}
                  >
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-paleBlue/20">
                      {imageUrls[enemy.id] ? (
                        <Image
                          src={imageUrls[enemy.id] as string}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 object-cover object-top"
                        />
                      ) : imageUrls[enemy.id] === undefined ? (
                        <ImageLoadingSkeleton
                          variant="avatar"
                          className="h-full w-full [&_svg]:h-8 [&_svg]:w-8"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-black">
                          {enemy.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="truncate">{enemy.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded border border-white/20 p-3">
          {!selected ? (
            <p className="text-sm text-white/75">
              Select an enemy to view details.
            </p>
          ) : (
            <div className="space-y-3 text-sm text-white">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-paleBlue/20">
                  {imageUrls[selected.id] ? (
                    <Image
                      src={imageUrls[selected.id] as string}
                      alt={`${selected.name} avatar`}
                      width={48}
                      height={48}
                      className="h-12 w-12 object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-black">
                      {selected.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
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

              {selected.description ? (
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-white/65">
                    Description
                  </p>
                  <div
                    className="character-note-html text-sm text-white/90"
                    dangerouslySetInnerHTML={{ __html: selected.description }}
                  />
                </div>
              ) : null}

              {selected.notes ? (
                <div>
                  <p className="mb-1 text-xs uppercase tracking-wide text-white/65">
                    Notes
                  </p>
                  <div
                    className="character-note-html text-sm text-white/90"
                    dangerouslySetInnerHTML={{ __html: selected.notes }}
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2 text-xs text-white/80">
                <p>Reactions: {selected.numberOfReactions}</p>
                <p>Actions: {selected.actions.length}</p>
                <p>Additional: {selected.additionalActions.length}</p>
                <p>Immunities: {selected.immunities.length}</p>
              </div>
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
