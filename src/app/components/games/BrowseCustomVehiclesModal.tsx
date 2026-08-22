"use client";

import { CreateCustomVehicleModal } from "@/app/components/games/CreateCustomVehicleModal";
import { GiveVehicleToCharacterModal } from "@/app/components/games/GiveVehicleToCharacterModal";
import { Button } from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { RemoteThumbnail } from "@/app/components/shared/RemoteThumbnail";
import { StoredRichTextHtml } from "@/app/components/shared/StoredRichTextHtml";
import { TextField } from "@/app/components/shared/TextField";
import {
  VEHICLE_ACCELERATION_LABEL,
  VEHICLE_COMBAT_SPEED_LABEL,
  VEHICLE_TRAVEL_SPEED_LABEL,
} from "@/app/lib/constants/vehicleFields";
import type { GameDetail } from "@/app/lib/types/game";
import type { CustomVehicleResponse } from "@/app/lib/types/vehicle";
import { useImageUrls } from "@/hooks/use-image-urls";
import { fetchGameCustomVehicles } from "@/lib/api/customVehicles";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useCallback, useEffect, useMemo, useState } from "react";

type BrowseCustomVehiclesModalProps = {
  isOpen: boolean;
  gameId: string;
  game: GameDetail;
  gameName: string;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
};

function vehicleLabel(vehicle: CustomVehicleResponse): string {
  const brand = vehicle.brand?.trim();
  return brand ? `${vehicle.name} — ${brand}` : vehicle.name;
}

export function BrowseCustomVehiclesModal(
  props: BrowseCustomVehiclesModalProps
) {
  if (!props.isOpen) return null;
  return <BrowseCustomVehiclesModalContent {...props} />;
}

function BrowseCustomVehiclesModalContent({
  gameId,
  game,
  gameName,
  onClose,
  onSuccess,
}: BrowseCustomVehiclesModalProps) {
  const [vehicles, setVehicles] = useState<CustomVehicleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [giveOpen, setGiveOpen] = useState(false);
  const [editCustomVehicleId, setEditCustomVehicleId] = useState<string | null>(
    null
  );

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchGameCustomVehicles(gameId);
      setVehicles(rows);
      setSelectedId((curr) => curr || rows[0]?.id || "");
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to load custom vehicles"));
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...vehicles].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
    if (!q) return sorted;
    return sorted.filter((vehicle) => {
      const haystack = [
        vehicle.name,
        vehicle.brand ?? "",
        vehicle.description ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search, vehicles]);

  const selected = useMemo(
    () => filtered.find((v) => v.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId]
  );

  const imageUrls = useImageUrls(
    vehicles.map((vehicle) => ({
      id: vehicle.id,
      imageKey: vehicle.imageKey ?? null,
    }))
  );

  return (
    <>
      <ModalShell
        isOpen
        onClose={onClose}
        title={`Browse custom vehicles — ${gameName}`}
        titleId="browse-custom-vehicles-title"
        maxWidthClass="max-w-4xl"
      >
        <p className="mt-1 text-xs text-white/70">
          Custom vehicles for this game. Give one to a character or edit the
          template.
        </p>
        <div className="mt-3">
          <TextField
            id="browse-custom-vehicles-search"
            type="search"
            variant="dark"
            density="compact"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search custom vehicles…"
            aria-label="Search custom vehicles"
          />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[17rem_minmax(0,1fr)]">
          <div className="max-h-[55vh] overflow-y-auto rounded border border-white/20 p-2">
            {loading ? (
              <p className="px-2 py-3 text-sm text-white/75">
                Loading custom vehicles…
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-2 py-3 text-sm text-white/75">
                No custom vehicles yet. Create one from the Vehicles section.
              </p>
            ) : (
              <ul className="space-y-1">
                {filtered.map((vehicle) => (
                  <li key={vehicle.id}>
                    <Button
                      type="button"
                      variant={
                        selected?.id === vehicle.id
                          ? "modalBrowseListRowSelected"
                          : "modalBrowseListRow"
                      }
                      fullWidth={false}
                      className="w-full"
                      onClick={() => setSelectedId(vehicle.id)}
                    >
                      <RemoteThumbnail
                        imageUrl={imageUrls[vehicle.id]}
                        imageKey={vehicle.imageKey}
                        alt=""
                        size={32}
                        variant="vehicle"
                        className="h-8 w-8"
                      />
                      <span className="truncate">{vehicleLabel(vehicle)}</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="max-h-[55vh] overflow-y-auto rounded border border-white/20 p-3">
            {!selected ? (
              <p className="text-sm text-white/75">
                Select a vehicle to view details.
              </p>
            ) : (
              <div className="space-y-3 text-sm text-white">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {selected.name}
                  </h3>
                  {selected.brand ? (
                    <p className="text-xs text-white/70">{selected.brand}</p>
                  ) : null}
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-white/60">Max HP</dt>
                    <dd>{selected.maxHp}</dd>
                  </div>
                  <div>
                    <dt className="text-white/60">
                      {VEHICLE_TRAVEL_SPEED_LABEL}
                    </dt>
                    <dd>{selected.travelSpeedKmh} km/h</dd>
                  </div>
                  <div>
                    <dt className="text-white/60">
                      {VEHICLE_COMBAT_SPEED_LABEL}
                    </dt>
                    <dd>{selected.combatSpeedMetres} m</dd>
                  </div>
                  <div>
                    <dt className="text-white/60">
                      {VEHICLE_ACCELERATION_LABEL}
                    </dt>
                    <dd>{selected.acceleration}</dd>
                  </div>
                  <div>
                    <dt className="text-white/60">Passengers</dt>
                    <dd>{selected.maxPassengers}</dd>
                  </div>
                  <div>
                    <dt className="text-white/60">Size</dt>
                    <dd>{selected.vehicleSizeCategory}</dd>
                  </div>
                </dl>
                {selected.description ? (
                  <StoredRichTextHtml
                    content={selected.description}
                    className="text-sm text-white/85"
                  />
                ) : null}
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
            disabled={!selected || loading}
            onClick={() => {
              if (selected) setEditCustomVehicleId(selected.id);
            }}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="semanticWarningOutline"
            disabled={!selected || loading}
            onClick={() => setGiveOpen(true)}
          >
            Give to character
          </Button>
        </div>
      </ModalShell>

      {selected ? (
        <GiveVehicleToCharacterModal
          isOpen={giveOpen}
          gameId={gameId}
          game={game}
          lockedVehicle={{
            sourceType: "CUSTOM_VEHICLE",
            vehicleId: selected.id,
            vehicleName: selected.name,
          }}
          onClose={() => setGiveOpen(false)}
          onSuccess={() => {
            setGiveOpen(false);
            void onSuccess?.();
          }}
        />
      ) : null}

      <CreateCustomVehicleModal
        isOpen={editCustomVehicleId != null}
        gameId={gameId}
        gameName={gameName}
        editCustomVehicleId={editCustomVehicleId}
        onClose={() => setEditCustomVehicleId(null)}
        onSuccess={() => {
          setEditCustomVehicleId(null);
          void loadVehicles().then(() => onSuccess?.());
        }}
      />
    </>
  );
}
