"use client";

import type { CharacterSectionSlide } from "@/app/components/character/CharacterSectionCarousel";
import { AddVehicleToCharacterModal } from "@/app/components/character/AddVehicleToCharacterModal";
import { VehicleDetailModal } from "@/app/components/character/VehicleDetailModal";
import { Button } from "@/app/components/shared/Button";
import { CreateUniqueVehicleModal } from "@/app/components/games/CreateUniqueVehicleModal";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import { isGiveItemRecipientInGame } from "@/app/lib/gmUtils";
import type { CharacterDetail, ItemCharacter } from "@/app/lib/types/character";
import type { VehicleCharacter } from "@/app/lib/types/vehicle";
import { getGameById } from "@/lib/api/game";
import { useImageUrls } from "@/hooks/use-image-urls";
import type { KeyedMutator } from "swr";
import { useCallback, useMemo, useState } from "react";

function locomotionLabel(modes: string[] | undefined): string {
  if (!modes?.length) return "—";
  return modes.join(" · ");
}

function statusLabel(entry: VehicleCharacter): string {
  if (entry.derivedStatus === "OPERATIONAL") return "Operational";
  if (entry.derivedStatus === "BROKEN_DOWN") return "Broken down";
  return "Beyond repair";
}

function statusTextClassName(entry: VehicleCharacter): string {
  if (entry.derivedStatus === "OPERATIONAL") return "text-neblirSafe-600";
  if (entry.derivedStatus === "BROKEN_DOWN") return "text-neblirWarning-600";
  return "text-neblirDanger-600";
}

function displayVehicleName(entry: VehicleCharacter): string {
  return entry.customName ?? entry.vehicle?.name ?? "Unknown vehicle";
}

function VehicleList({
  entries,
  activeVehicleCharacterId,
  readOnly,
  imageUrls,
  onSelectDetail,
}: {
  entries: VehicleCharacter[];
  activeVehicleCharacterId?: string | null;
  readOnly?: boolean;
  imageUrls: Record<string, string | null | undefined>;
  onSelectDetail: (entry: VehicleCharacter) => void;
}) {
  if (entries.length === 0) return null;

  return (
    <ul className="divide-y divide-black">
      {entries.map((entry) => {
        const isActive = activeVehicleCharacterId === entry.id;
        const imageKey = entry.vehicle?.imageKey ?? null;
        const imageUrl = imageUrls[entry.id];
        const content = (
          <>
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-black/10 bg-paleBlue/30">
              {imageKey && imageUrl ? (
                <SignedRemoteImage
                  src={imageUrl}
                  imageKey={imageKey}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 object-cover object-center"
                />
              ) : (
                <ImageLoadingSkeleton
                  variant="vehicle"
                  className="h-full w-full"
                  animated={imageKey != null && imageUrl === undefined}
                />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="break-words text-sm text-black">
                  {displayVehicleName(entry)}
                </span>
                <span className={`text-xs ${statusTextClassName(entry)}`}>
                  {statusLabel(entry)}
                </span>
                {isActive ? (
                  <span className="text-xs text-customPrimary">Riding</span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-black/65">
                {entry.effectiveMaxHp != null
                  ? `${entry.currentHp} / ${entry.effectiveMaxHp} HP`
                  : `${entry.currentHp} HP`}
                {entry.vehicle?.combatSpeedMetres != null
                  ? ` · ${entry.vehicle.combatSpeedMetres}m combat`
                  : ""}
                {entry.vehicle?.travelSpeedKmh != null
                  ? ` · ${entry.vehicle.travelSpeedKmh}km/h travel`
                  : ""}
              </p>
              <p className="mt-1 text-xs text-black/55">
                {entry.vehicle?.vehicleSizeCategory ?? "—"} ·{" "}
                {locomotionLabel(entry.vehicle?.locomotionModes)}
                {!isActive && entry.parkedAt?.trim()
                  ? ` · Parked at ${entry.parkedAt.trim()}`
                  : ""}
              </p>
            </div>
            <div className="text-right text-xs text-black/60">
              Manoeuvrability {entry.vehicle?.manoeuvrability ?? "—"}
            </div>
          </>
        );

        return (
          <li
            key={entry.id}
            className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-start gap-3 py-2.5"
          >
            {readOnly ? (
              content
            ) : (
              <Button
                type="button"
                variant="lightRowHit"
                fullWidth={false}
                className="col-span-3 grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-start gap-3"
                onClick={() => onSelectDetail(entry)}
              >
                {content}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function VehiclesCountPill({ count }: { count: number }) {
  return (
    <span className="rounded border border-black bg-transparent px-2 py-0.5 text-sm tabular-nums text-black">
      {count}
    </span>
  );
}

interface VehiclesSectionContentProps {
  character: CharacterDetail;
  mutate?: KeyedMutator<CharacterDetail | null>;
  activeGameId: string | null;
  readOnly?: boolean;
}

function VehiclesSectionContent({
  character,
  mutate,
  activeGameId,
  readOnly = false,
}: VehiclesSectionContentProps) {
  const [browseModalOpen, setBrowseModalOpen] = useState(false);
  const [createUniqueOpen, setCreateUniqueOpen] = useState(false);
  const [editUniqueVehicleState, setEditUniqueVehicleState] = useState<{
    id: string;
    gameId: string;
    gameName: string;
  } | null>(null);
  const [detailVehicleId, setDetailVehicleId] = useState<string | null>(null);

  const vehicles = useMemo(
    () =>
      (character.vehicles ?? []).filter(
        (entry) => entry.characterId === character.id
      ),
    [character.id, character.vehicles]
  );
  const activeVehicle = useMemo(
    () =>
      vehicles.find(
        (entry) => entry.id === character.activeVehicleCharacterId
      ) ?? null,
    [character.activeVehicleCharacterId, vehicles]
  );
  const sortedVehicles = useMemo(
    () =>
      [...vehicles].sort((a, b) =>
        displayVehicleName(a).localeCompare(displayVehicleName(b), undefined, {
          sensitivity: "base",
        })
      ),
    [vehicles]
  );
  const vehicleImageEntries = useMemo(
    () =>
      sortedVehicles.map((entry) => ({
        id: entry.id,
        imageKey: entry.vehicle?.imageKey ?? null,
      })),
    [sortedVehicles]
  );
  const vehicleImageUrls = useImageUrls(vehicleImageEntries);
  const parkedVehicles = useMemo(
    () =>
      sortedVehicles.filter(
        (entry) => entry.id !== character.activeVehicleCharacterId
      ),
    [character.activeVehicleCharacterId, sortedVehicles]
  );
  const detailEntry = useMemo(
    () => vehicles.find((entry) => entry.id === detailVehicleId) ?? null,
    [detailVehicleId, vehicles]
  );
  const activeGameName = useMemo(
    () =>
      character.games?.find((entry) => entry.gameId === activeGameId)?.game
        ?.name ??
      activeGameId ??
      "Active game",
    [activeGameId, character.games]
  );

  const resolveGiveRecipients = useCallback(
    async (entry: VehicleCharacter) => {
      const selfId = character.id;
      const linked = character.games?.map((g) => g.gameId) ?? [];
      const restrictGameId =
        entry.sourceType === "GLOBAL_VEHICLE"
          ? null
          : (entry.vehicle?.gameId ?? null);
      const gameIdSet = new Set(linked);
      if (restrictGameId != null) gameIdSet.add(restrictGameId);
      const gameIds = [...gameIdSet];
      if (gameIds.length === 0) return [];

      const games = await Promise.all(gameIds.map((id) => getGameById(id)));

      const restrictSet =
        restrictGameId != null
          ? new Set(
              (
                games.find((game) => game.id === restrictGameId)?.characters ??
                []
              ).map((gc) => gc.character.id)
            )
          : null;

      const byId = new Map<string, string>();
      for (const game of games) {
        if (!game) continue;
        for (const gc of game.characters ?? []) {
          const currentCharacter = gc.character;
          if (!isGiveItemRecipientInGame(gc, game, selfId)) continue;
          if (restrictSet != null && !restrictSet.has(currentCharacter.id))
            continue;
          const label =
            [currentCharacter.name, currentCharacter.surname ?? ""]
              .filter((value) => String(value).trim())
              .join(" ")
              .trim() || currentCharacter.id;
          if (!byId.has(currentCharacter.id)) {
            byId.set(currentCharacter.id, label);
          }
        }
      }

      return [...byId.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    [character.games, character.id]
  );

  const resolveItemGiveRecipients = useCallback(
    async (entry: ItemCharacter) => {
      const selfId = character.id;
      const linked = character.games?.map((g) => g.gameId) ?? [];
      let restrictGameId: string | null = null;
      if (
        entry.sourceType === "CUSTOM_ITEM" ||
        entry.sourceType === "UNIQUE_ITEM"
      ) {
        const gid = (entry.item as { gameId?: string } | null)?.gameId;
        if (gid) restrictGameId = gid;
      }
      const gameIdSet = new Set(linked);
      if (restrictGameId != null) gameIdSet.add(restrictGameId);
      const gameIds = [...gameIdSet];
      if (gameIds.length === 0) return [];

      const games = await Promise.all(gameIds.map((id) => getGameById(id)));

      const restrictSet =
        restrictGameId != null
          ? new Set(
              (
                games.find((game) => game.id === restrictGameId)?.characters ??
                []
              ).map((gc) => gc.character.id)
            )
          : null;

      const byId = new Map<string, string>();
      for (const game of games) {
        if (!game) continue;
        for (const gc of game.characters ?? []) {
          const currentCharacter = gc.character;
          if (!isGiveItemRecipientInGame(gc, game, selfId)) continue;
          if (restrictSet != null && !restrictSet.has(currentCharacter.id))
            continue;
          const label =
            [currentCharacter.name, currentCharacter.surname ?? ""]
              .filter((value) => String(value).trim())
              .join(" ")
              .trim() || currentCharacter.id;
          if (!byId.has(currentCharacter.id)) {
            byId.set(currentCharacter.id, label);
          }
        }
      }

      return [...byId.entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    [character.games, character.id]
  );

  return (
    <div className="space-y-0">
      {!readOnly ? (
        <div className="mb-2 flex flex-col gap-1.5 pb-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="lightToolbarCompact"
              fullWidth={false}
              onClick={() => setBrowseModalOpen(true)}
            >
              Browse vehicles
            </Button>
            <Button
              type="button"
              variant="lightToolbarCompact"
              fullWidth={false}
              onClick={() => setCreateUniqueOpen(true)}
              disabled={!activeGameId}
            >
              Create unique vehicle
            </Button>
          </div>
          {!activeGameId ? (
            <p className="text-xs text-black/65">
              Select an active game above to create a unique vehicle or browse
              game custom vehicles.
            </p>
          ) : null}
        </div>
      ) : null}

      {vehicles.length === 0 ? (
        <p className="py-4 text-center text-sm text-black">No vehicles</p>
      ) : (
        <div className="space-y-6">
          {activeVehicle ? (
            <div>
              <div className="mb-4 mt-2 border-b border-gray-200 pb-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-paleBlue">
                  Riding
                </h3>
              </div>
              <VehicleList
                entries={[activeVehicle]}
                activeVehicleCharacterId={character.activeVehicleCharacterId}
                readOnly={readOnly}
                imageUrls={vehicleImageUrls}
                onSelectDetail={(entry) => setDetailVehicleId(entry.id)}
              />
            </div>
          ) : null}

          {parkedVehicles.length > 0 ? (
            <div>
              <div className="mb-4 mt-2 border-b border-gray-200 pb-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-paleBlue">
                  Owned vehicles
                </h3>
              </div>
              <VehicleList
                entries={parkedVehicles}
                activeVehicleCharacterId={character.activeVehicleCharacterId}
                readOnly={readOnly}
                imageUrls={vehicleImageUrls}
                onSelectDetail={(entry) => setDetailVehicleId(entry.id)}
              />
            </div>
          ) : null}
        </div>
      )}

      {browseModalOpen && !readOnly && mutate ? (
        <AddVehicleToCharacterModal
          isOpen={browseModalOpen}
          onCloseAction={() => setBrowseModalOpen(false)}
          character={character}
          activeGameId={activeGameId}
          mutateAction={mutate}
        />
      ) : null}

      {createUniqueOpen && !readOnly && mutate && activeGameId ? (
        <CreateUniqueVehicleModal
          key={`create-unique-vehicle-${character.id}-${activeGameId}`}
          isOpen={createUniqueOpen}
          gameId={activeGameId}
          gameName={activeGameName}
          characterId={character.id}
          onCloseAction={() => setCreateUniqueOpen(false)}
          onSuccessAction={() => {
            void mutate();
          }}
        />
      ) : null}

      {editUniqueVehicleState && !readOnly && mutate ? (
        <CreateUniqueVehicleModal
          key={`edit-unique-vehicle-${editUniqueVehicleState.id}`}
          isOpen={Boolean(editUniqueVehicleState)}
          gameId={editUniqueVehicleState.gameId}
          gameName={editUniqueVehicleState.gameName}
          characterId={character.id}
          editUniqueVehicleId={editUniqueVehicleState.id}
          onCloseAction={() => setEditUniqueVehicleState(null)}
          onSuccessAction={() => {
            setEditUniqueVehicleState(null);
            setDetailVehicleId(null);
            void mutate();
          }}
        />
      ) : null}

      {detailEntry && !readOnly && mutate ? (
        <VehicleDetailModal
          key={`vehicle-detail-${detailEntry.id}`}
          isOpen={Boolean(detailEntry)}
          onCloseAction={() => setDetailVehicleId(null)}
          entry={detailEntry}
          character={character}
          characterId={character.id}
          inventory={character.inventory ?? []}
          allMountedItemCharacterIds={(character.vehicles ?? []).flatMap(
            (vehicle) =>
              (vehicle.mountedItems ?? []).map((mount) => mount.itemCharacterId)
          )}
          activeVehicleCharacterId={character.activeVehicleCharacterId}
          activeGameId={activeGameId}
          mutateAction={mutate}
          resolveGiveRecipientsAction={resolveGiveRecipients}
          resolveItemGiveRecipientsAction={resolveItemGiveRecipients}
          onEditUniqueVehicleAction={
            detailEntry.sourceType === "UNIQUE_VEHICLE" &&
            detailEntry.vehicle?.gameId
              ? () => {
                  const vehicleGameId = detailEntry.vehicle?.gameId;
                  if (!vehicleGameId) return;
                  const vehicleId = detailEntry.vehicleId;
                  const vehicleGameName =
                    character.games?.find(
                      (entry) => entry.gameId === vehicleGameId
                    )?.game?.name ?? vehicleGameId;
                  setEditUniqueVehicleState({
                    id: vehicleId,
                    gameId: vehicleGameId,
                    gameName: vehicleGameName,
                  });
                  setDetailVehicleId(null);
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}

export function getVehiclesSection(
  character: CharacterDetail,
  activeGameId: string | null,
  options?: {
    mutate?: KeyedMutator<CharacterDetail | null>;
    readOnly?: boolean;
  }
): CharacterSectionSlide {
  const readOnly = options?.readOnly === true;
  return {
    id: "vehicles",
    title: "Vehicles",
    titleSupplement: (
      <VehiclesCountPill count={character.vehicles?.length ?? 0} />
    ),
    children: (
      <VehiclesSectionContent
        character={character}
        mutate={options?.mutate}
        activeGameId={activeGameId}
        readOnly={readOnly}
      />
    ),
  };
}
