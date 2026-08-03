"use client";

import { Button } from "@/app/components/shared/Button";
import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";
import { TextField } from "@/app/components/shared/TextField";
import type {
  CustomVehicleResponse,
  ResolvedVehicle,
} from "@/app/lib/types/vehicle";
import { useImageUrls } from "@/hooks/use-image-urls";
import { fetchGameCustomVehicles } from "@/lib/api/customVehicles";
import { addVehicleToCharacter, getOfficialVehicles } from "@/lib/api/vehicles";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useEffect, useMemo, useState } from "react";
import type { KeyedMutator } from "swr";
import type { CharacterDetail } from "@/app/lib/types/character";

type AddVehicleToCharacterModalProps = {
  isOpen: boolean;
  onCloseAction: () => void;
  character: CharacterDetail;
  activeGameId: string | null;
  mutateAction: KeyedMutator<CharacterDetail | null>;
};

type BrowseVehicleRow = {
  id: string;
  sourceType: "GLOBAL_VEHICLE" | "CUSTOM_VEHICLE";
  name: string;
  brand: string | null | undefined;
  description: string | null | undefined;
  imageKey: string | null | undefined;
  maxHp: number | null | undefined;
  combatSpeedMetres: number | null | undefined;
  travelSpeedKmh: number | null | undefined;
  manoeuvrability: number | null | undefined;
  vehicleSizeCategory: string | null | undefined;
  locomotionModes: string[];
};

function toBrowseRow(
  sourceType: "GLOBAL_VEHICLE" | "CUSTOM_VEHICLE",
  vehicle: ResolvedVehicle | CustomVehicleResponse
): BrowseVehicleRow {
  return {
    id: vehicle.id ?? "",
    sourceType,
    name: vehicle.name ?? "Unnamed vehicle",
    brand: vehicle.brand,
    description: vehicle.description,
    imageKey: vehicle.imageKey,
    maxHp: vehicle.maxHp,
    combatSpeedMetres: vehicle.combatSpeedMetres,
    travelSpeedKmh: vehicle.travelSpeedKmh,
    manoeuvrability: vehicle.manoeuvrability,
    vehicleSizeCategory: vehicle.vehicleSizeCategory,
    locomotionModes: vehicle.locomotionModes ?? [],
  };
}

function matchesQuery(row: BrowseVehicleRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [row.name, row.brand ?? "", row.description ?? ""]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function locomotionLabel(modes: string[]): string {
  return modes.join(" · ") || "—";
}

export function AddVehicleToCharacterModal({
  isOpen,
  onCloseAction,
  character,
  activeGameId,
  mutateAction,
}: AddVehicleToCharacterModalProps) {
  const [officialVehicles, setOfficialVehicles] = useState<BrowseVehicleRow[]>(
    []
  );
  const [customVehicles, setCustomVehicles] = useState<BrowseVehicleRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setSearch("");

    void (async () => {
      try {
        const [official, custom] = await Promise.all([
          getOfficialVehicles(controller.signal),
          activeGameId
            ? fetchGameCustomVehicles(activeGameId, controller.signal)
            : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setOfficialVehicles(
          official.map((vehicle) => toBrowseRow("GLOBAL_VEHICLE", vehicle))
        );
        setCustomVehicles(
          custom.map((vehicle) => toBrowseRow("CUSTOM_VEHICLE", vehicle))
        );
      } catch (e) {
        if (!cancelled) {
          setError(getUserSafeErrorMessage(e, "Failed to load vehicles"));
          setOfficialVehicles([]);
          setCustomVehicles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [activeGameId, isOpen]);

  const filteredOfficial = useMemo(
    () => officialVehicles.filter((row) => matchesQuery(row, search)),
    [officialVehicles, search]
  );
  const filteredCustom = useMemo(
    () => customVehicles.filter((row) => matchesQuery(row, search)),
    [customVehicles, search]
  );

  const imageEntries = useMemo(
    () =>
      [...filteredOfficial, ...filteredCustom]
        .filter((row): row is BrowseVehicleRow & { imageKey: string } =>
          Boolean(row.imageKey)
        )
        .map((row) => ({
          id: `${row.sourceType}-${row.id}`,
          imageKey: row.imageKey,
        })),
    [filteredCustom, filteredOfficial]
  );
  const imageUrls = useImageUrls(imageEntries);

  const handleAdd = async (row: BrowseVehicleRow) => {
    setAddingId(`${row.sourceType}-${row.id}`);
    setError(null);
    try {
      await addVehicleToCharacter(character.id, {
        sourceType: row.sourceType,
        vehicleId: row.id,
      });
      await mutateAction();
      onCloseAction();
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to add vehicle"));
    } finally {
      setAddingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen
      onClose={onCloseAction}
      title="Browse vehicles"
      titleId="browse-vehicles-modal-title"
      subtitle={
        activeGameId
          ? "Add official vehicles or custom vehicles from the active game."
          : "Add official vehicles. Select an active game to also browse that game’s custom vehicles."
      }
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4 text-sm text-white">
        <div>
          <TextField
            id="browse-vehicles-search"
            type="search"
            variant="dark"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, brand, or description"
            disabled={loading || addingId != null}
          />
        </div>

        {error ? (
          <p className="text-sm text-neblirDanger-400">{error}</p>
        ) : null}
        {loading ? <p className="text-white/70">Loading vehicles…</p> : null}

        {!loading ? (
          <div className="space-y-5">
            <section>
              <h3 className="mb-2 text-sm font-semibold text-white/90">
                Official vehicles
              </h3>
              {filteredOfficial.length > 0 ? (
                <ul className="space-y-2">
                  {filteredOfficial.map((row) => {
                    const imageUrl = row.imageKey
                      ? imageUrls[`${row.sourceType}-${row.id}`]
                      : null;
                    const isAdding = addingId === `${row.sourceType}-${row.id}`;
                    return (
                      <li key={`${row.sourceType}-${row.id}`}>
                        <div className="flex items-start gap-3 rounded-md border border-white/20 bg-white/5 p-3">
                          {row.imageKey ? (
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-transparent">
                              {imageUrl ? (
                                <SignedRemoteImage
                                  src={imageUrl}
                                  imageKey={row.imageKey}
                                  alt=""
                                  width={64}
                                  height={64}
                                  className="h-16 w-16 object-cover object-center"
                                />
                              ) : imageUrl === undefined ? (
                                <ImageLoadingSkeleton
                                  variant="item"
                                  className="!bg-transparent"
                                />
                              ) : null}
                            </div>
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <p className="font-semibold text-white">
                                {row.name}
                              </p>
                              <p className="text-xs text-white/65">
                                {row.vehicleSizeCategory ?? "—"} ·{" "}
                                {locomotionLabel(row.locomotionModes)}
                              </p>
                            </div>
                            <p className="mt-1 text-xs text-white/70">
                              {row.brand ? `${row.brand} · ` : ""}
                              {row.maxHp ?? "—"} HP ·{" "}
                              {row.combatSpeedMetres ?? "—"}m combat ·{" "}
                              {row.travelSpeedKmh ?? "—"}km/h travel
                            </p>
                            <p className="mt-1 text-xs text-white/55">
                              Manoeuvrability {row.manoeuvrability ?? "—"}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="modalPalePrimary"
                            fullWidth={false}
                            disabled={isAdding}
                            onClick={() => {
                              void handleAdd(row);
                            }}
                          >
                            {isAdding ? "Adding…" : "Add"}
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-white/65">
                  No official vehicles match your search.
                </p>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-white/90">
                Active game custom vehicles
              </h3>
              {activeGameId ? (
                filteredCustom.length > 0 ? (
                  <ul className="space-y-2">
                    {filteredCustom.map((row) => {
                      const imageUrl = row.imageKey
                        ? imageUrls[`${row.sourceType}-${row.id}`]
                        : null;
                      const isAdding =
                        addingId === `${row.sourceType}-${row.id}`;
                      return (
                        <li key={`${row.sourceType}-${row.id}`}>
                          <div className="flex items-start gap-3 rounded-md border border-white/20 bg-white/5 p-3">
                            {row.imageKey ? (
                              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-transparent">
                                {imageUrl ? (
                                  <SignedRemoteImage
                                    src={imageUrl}
                                    imageKey={row.imageKey}
                                    alt=""
                                    width={64}
                                    height={64}
                                    className="h-16 w-16 object-cover object-center"
                                  />
                                ) : imageUrl === undefined ? (
                                  <ImageLoadingSkeleton
                                    variant="item"
                                    className="!bg-transparent"
                                  />
                                ) : null}
                              </div>
                            ) : null}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p className="font-semibold text-white">
                                  {row.name}
                                </p>
                                <p className="text-xs text-white/65">
                                  {row.vehicleSizeCategory ?? "—"} ·{" "}
                                  {locomotionLabel(row.locomotionModes)}
                                </p>
                              </div>
                              <p className="mt-1 text-xs text-white/70">
                                {row.brand ? `${row.brand} · ` : ""}
                                {row.maxHp ?? "—"} HP ·{" "}
                                {row.combatSpeedMetres ?? "—"}m combat ·{" "}
                                {row.travelSpeedKmh ?? "—"}km/h travel
                              </p>
                              <p className="mt-1 text-xs text-white/55">
                                Manoeuvrability {row.manoeuvrability ?? "—"}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="modalPalePrimary"
                              fullWidth={false}
                              disabled={isAdding}
                              onClick={() => {
                                void handleAdd(row);
                              }}
                            >
                              {isAdding ? "Adding…" : "Add"}
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-white/65">
                    No custom vehicles match your search.
                  </p>
                )
              ) : (
                <p className="text-sm text-white/65">
                  Select an active game on the character page to browse that
                  game’s custom vehicles.
                </p>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}
