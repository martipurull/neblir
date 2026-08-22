"use client";

import { CreateCustomVehicleModal } from "@/app/components/games/CreateCustomVehicleModal";
import { CreateUniqueVehicleModal } from "@/app/components/games/CreateUniqueVehicleModal";
import { GiveVehicleToCharacterModal } from "@/app/components/games/GiveVehicleToCharacterModal";
import { Button } from "@/app/components/shared/Button";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { PageSection } from "@/app/components/shared/PageSection";
import { PageTitle } from "@/app/components/shared/PageTitle";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import { TextField } from "@/app/components/shared/TextField";
import type { CustomVehicleResponse } from "@/app/lib/types/vehicle";
import { useGame } from "@/hooks/use-game";
import { useImageUrls } from "@/hooks/use-image-urls";
import { useUser } from "@/hooks/use-user";
import { fetchGameCustomVehicles } from "@/lib/api/customVehicles";
import { getGameUniqueVehicles } from "@/lib/api/uniqueVehicles";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

function locomotionLabel(modes: string[]): string {
  return modes.join(" · ");
}

type UniqueVehicleListRow = {
  id: string;
  name: string;
  ownerUserId: string;
};

export default function GameCustomVehiclesPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const { game, loading, error, refetch, mutate } = useGame(id);
  const { user } = useUser();
  const [vehicles, setVehicles] = useState<CustomVehicleResponse[]>([]);
  const [uniqueVehicles, setUniqueVehicles] = useState<UniqueVehicleListRow[]>(
    []
  );
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingUniqueVehicles, setLoadingUniqueVehicles] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [uniqueSearch, setUniqueSearch] = useState("");
  const [editCustomVehicleId, setEditCustomVehicleId] = useState<string | null>(
    null
  );
  const [editUniqueVehicleId, setEditUniqueVehicleId] = useState<string | null>(
    null
  );
  const [giveVehicleModalOpen, setGiveVehicleModalOpen] = useState(false);
  const [lockedGiveVehicle, setLockedGiveVehicle] = useState<{
    sourceType: "CUSTOM_VEHICLE";
    vehicleId: string;
    vehicleName: string;
  } | null>(null);

  const loadVehicles = useCallback(async (gameId: string) => {
    setLoadingVehicles(true);
    setLoadingUniqueVehicles(true);
    setListError(null);
    try {
      const [customRows, uniqueRows] = await Promise.all([
        fetchGameCustomVehicles(gameId),
        getGameUniqueVehicles(gameId),
      ]);
      setVehicles(customRows);
      setUniqueVehicles(uniqueRows);
    } catch (e) {
      setListError(getUserSafeErrorMessage(e, "Failed to load vehicles"));
      setVehicles([]);
      setUniqueVehicles([]);
    } finally {
      setLoadingVehicles(false);
      setLoadingUniqueVehicles(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    void loadVehicles(id);
  }, [id, loadVehicles]);

  const sortedVehicles = useMemo(
    () =>
      [...vehicles].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
    [vehicles]
  );

  const filteredVehicles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedVehicles;
    return sortedVehicles.filter((vehicle) => {
      const haystack = [
        vehicle.name,
        vehicle.brand ?? "",
        vehicle.description ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search, sortedVehicles]);

  const sortedUniqueVehicles = useMemo(
    () =>
      [...uniqueVehicles].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      ),
    [uniqueVehicles]
  );

  const filteredUniqueVehicles = useMemo(() => {
    const q = uniqueSearch.trim().toLowerCase();
    if (!q) return sortedUniqueVehicles;
    return sortedUniqueVehicles.filter((vehicle) =>
      vehicle.name.toLowerCase().includes(q)
    );
  }, [sortedUniqueVehicles, uniqueSearch]);

  const imageEntries = useMemo(
    () =>
      filteredVehicles
        .filter((vehicle) => Boolean(vehicle.imageKey))
        .map((vehicle) => ({ id: vehicle.id, imageKey: vehicle.imageKey })),
    [filteredVehicles]
  );
  const imageUrls = useImageUrls(imageEntries);

  if (!id) {
    return (
      <PageSection>
        <ErrorState message="Invalid game" />
      </PageSection>
    );
  }

  if (loading) {
    return (
      <PageSection>
        <LoadingState text="Loading game…" />
      </PageSection>
    );
  }

  if (error || !game) {
    return (
      <PageSection>
        <ErrorState
          message={error ?? "Game not found"}
          onRetry={refetch}
          retryLabel="Retry"
        />
      </PageSection>
    );
  }

  const isGameMaster = game.isGameMaster === true;
  const currentUserId = user?.id;

  const refreshLists = () => {
    if (id) void loadVehicles(id);
    void refetch();
    void mutate();
  };

  const openGiveForCustom = (vehicle: CustomVehicleResponse) => {
    setLockedGiveVehicle({
      sourceType: "CUSTOM_VEHICLE",
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
    });
    setGiveVehicleModalOpen(true);
  };

  const canManageUnique = (vehicle: UniqueVehicleListRow) =>
    isGameMaster ||
    (currentUserId != null && vehicle.ownerUserId === currentUserId);

  return (
    <PageSection>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="mb-4">
          <PageTitle>Custom vehicles</PageTitle>
          <p className="mt-1 text-sm text-black/70">
            Custom and unique vehicles for{" "}
            <span className="font-semibold">{game.name}</span>
          </p>
        </div>
        {isGameMaster ? (
          <div className="mb-4 flex flex-wrap gap-2">
            <Link
              href={`/home/games/${game.id}/custom-vehicles/create`}
              className="inline-flex items-center justify-center rounded-md border border-black bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              Create custom vehicle
            </Link>
            <Button
              type="button"
              variant="primary"
              fullWidth={false}
              onClick={() => {
                setLockedGiveVehicle(null);
                setGiveVehicleModalOpen(true);
              }}
            >
              Give vehicle to character
            </Button>
          </div>
        ) : null}
      </div>

      {listError ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {listError}
        </p>
      ) : null}

      <InfoCard border={false} className="mt-4">
        {loadingVehicles ? (
          <p className="py-4 text-sm text-black/60">Loading custom vehicles…</p>
        ) : sortedVehicles.length > 0 ? (
          <>
            <div className="mb-3">
              <label htmlFor="custom-vehicles-search" className="sr-only">
                Search custom vehicles
              </label>
              <TextField
                id="custom-vehicles-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, brand, or description"
                className="text-sm sm:max-w-sm"
              />
            </div>
            {filteredVehicles.length > 0 ? (
              <ul className="space-y-2">
                {filteredVehicles.map((vehicle) => {
                  const imageUrl = vehicle.imageKey
                    ? (imageUrls[vehicle.id] ?? undefined)
                    : null;
                  return (
                    <li key={vehicle.id}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                        <Button
                          type="button"
                          variant="lightBrowseRow"
                          fullWidth={false}
                          className={`min-w-0 flex-1 ${vehicle.imageKey ? "gap-3" : ""}`}
                          onClick={() => setEditCustomVehicleId(vehicle.id)}
                          disabled={!isGameMaster}
                        >
                          {vehicle.imageKey ? (
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-transparent">
                              {imageUrl ? (
                                <SignedRemoteImage
                                  src={imageUrl}
                                  imageKey={vehicle.imageKey}
                                  alt=""
                                  width={56}
                                  height={56}
                                  className="h-14 w-14 object-cover object-center"
                                />
                              ) : imageUrl === undefined ? (
                                <ImageLoadingSkeleton
                                  variant="item"
                                  className="!bg-transparent"
                                />
                              ) : null}
                            </div>
                          ) : null}
                          <div className="min-w-0 flex-1 py-0.5 text-left">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                              <span className="font-semibold">
                                {vehicle.name}
                              </span>
                              <span className="shrink-0 text-xs text-black/55">
                                {vehicle.vehicleSizeCategory} ·{" "}
                                {locomotionLabel(vehicle.locomotionModes)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-snug text-black/65">
                              {vehicle.brand ? `${vehicle.brand} · ` : ""}
                              {vehicle.maxHp} HP · {vehicle.combatSpeedMetres}m
                              combat · {vehicle.travelSpeedKmh}km/h travel
                            </p>
                          </div>
                        </Button>
                        {isGameMaster ? (
                          <Button
                            type="button"
                            variant="lightToolbarCompact"
                            fullWidth={false}
                            className="sm:self-center"
                            onClick={() => openGiveForCustom(vehicle)}
                          >
                            Give
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-4 text-sm text-black/60">
                No custom vehicles match your search.
              </p>
            )}
          </>
        ) : (
          <p className="py-4 text-sm text-black/60">
            No custom vehicles for this game yet.
          </p>
        )}
      </InfoCard>

      <InfoCard border={false} className="mt-6">
        <h2 className="text-base font-semibold text-black">Unique vehicles</h2>
        <p className="mt-1 text-sm text-black/70">
          Player-owned unique vehicles linked to this game.
        </p>
        {loadingUniqueVehicles ? (
          <p className="mt-3 text-sm text-black/60">Loading unique vehicles…</p>
        ) : sortedUniqueVehicles.length > 0 ? (
          <>
            <div className="mb-3 mt-3">
              <label htmlFor="unique-vehicles-search" className="sr-only">
                Search unique vehicles
              </label>
              <TextField
                id="unique-vehicles-search"
                type="search"
                value={uniqueSearch}
                onChange={(e) => setUniqueSearch(e.target.value)}
                placeholder="Search unique vehicles by name"
                className="text-sm sm:max-w-sm"
              />
            </div>
            {filteredUniqueVehicles.length > 0 ? (
              <ul className="space-y-2">
                {filteredUniqueVehicles.map((vehicle) => {
                  const manageable = canManageUnique(vehicle);
                  return (
                    <li key={vehicle.id}>
                      <Button
                        type="button"
                        variant="lightBrowseRow"
                        fullWidth={false}
                        className="w-full"
                        disabled={!manageable}
                        onClick={() => setEditUniqueVehicleId(vehicle.id)}
                      >
                        <div className="min-w-0 flex-1 py-0.5 text-left">
                          <span className="font-semibold">{vehicle.name}</span>
                          <div className="mt-1 text-xs text-black/55">
                            {manageable
                              ? "Click to edit overrides"
                              : "View-only for non-owners"}
                          </div>
                        </div>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-4 text-sm text-black/60">
                No unique vehicles match your search.
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm text-black/60">
            No unique vehicles for this game yet.
          </p>
        )}
      </InfoCard>

      {isGameMaster && editCustomVehicleId ? (
        <CreateCustomVehicleModal
          isOpen={Boolean(editCustomVehicleId)}
          gameId={game.id}
          gameName={game.name}
          editCustomVehicleId={editCustomVehicleId}
          onClose={() => setEditCustomVehicleId(null)}
          onSuccess={() => {
            setEditCustomVehicleId(null);
            refreshLists();
          }}
        />
      ) : null}

      {editUniqueVehicleId ? (
        <CreateUniqueVehicleModal
          isOpen={Boolean(editUniqueVehicleId)}
          gameId={game.id}
          gameName={game.name}
          editUniqueVehicleId={editUniqueVehicleId}
          onCloseAction={() => setEditUniqueVehicleId(null)}
          onSuccessAction={() => {
            setEditUniqueVehicleId(null);
            refreshLists();
          }}
        />
      ) : null}

      {isGameMaster ? (
        <GiveVehicleToCharacterModal
          isOpen={giveVehicleModalOpen}
          gameId={game.id}
          game={game}
          lockedVehicle={lockedGiveVehicle ?? undefined}
          onClose={() => {
            setGiveVehicleModalOpen(false);
            setLockedGiveVehicle(null);
          }}
          onSuccess={() => {
            setGiveVehicleModalOpen(false);
            setLockedGiveVehicle(null);
            refreshLists();
          }}
        />
      ) : null}
    </PageSection>
  );
}
