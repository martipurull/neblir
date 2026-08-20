"use client";

import type { GameDetail } from "@/app/lib/types/game";
import type {
  CustomVehicleResponse,
  ResolvedVehicle,
  UniqueVehicleListItem,
} from "@/app/lib/types/vehicle";
import {
  ModalSelect,
  type ModalSelectOption,
} from "@/app/components/games/shared/ModalSelect";
import { Button } from "@/app/components/shared/Button";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { giveVehicleToCharacter } from "@/lib/api/game";
import { fetchGameCustomVehicles } from "@/lib/api/customVehicles";
import { getGameUniqueVehicles } from "@/lib/api/uniqueVehicles";
import { getOfficialVehicles } from "@/lib/api/vehicles";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import { useCallback, useEffect, useState } from "react";

type GiveVehicleSourceType =
  | "GLOBAL_VEHICLE"
  | "CUSTOM_VEHICLE"
  | "UNIQUE_VEHICLE";

export type GiveVehicleOption = {
  sourceType: GiveVehicleSourceType;
  vehicleId: string;
  label: string;
};

type GiveVehicleLockedVehicle = {
  sourceType: GiveVehicleSourceType;
  vehicleId: string;
  vehicleName: string;
};

export type GiveVehicleToCharacterModalProps = {
  isOpen: boolean;
  gameId: string;
  game: GameDetail;
  /** When set, only the character is chosen (vehicle is fixed). */
  lockedVehicle?: GiveVehicleLockedVehicle;
  onClose: () => void;
  onSuccess?: () => void;
};

function vehicleLabel(
  vehicle: ResolvedVehicle | CustomVehicleResponse
): string {
  const name = vehicle.name?.trim() ?? "Unnamed vehicle";
  const brand = vehicle.brand?.trim();
  return brand ? `${name} — ${brand}` : name;
}

export function GiveVehicleToCharacterModal({
  isOpen,
  gameId,
  game,
  lockedVehicle,
  onClose,
  onSuccess,
}: GiveVehicleToCharacterModalProps) {
  const [globalVehicles, setGlobalVehicles] = useState<ResolvedVehicle[]>([]);
  const [customVehicles, setCustomVehicles] = useState<CustomVehicleResponse[]>(
    []
  );
  const [uniqueVehicles, setUniqueVehicles] = useState<UniqueVehicleListItem[]>(
    []
  );
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [loadingUnique, setLoadingUnique] = useState(false);
  const [characterId, setCharacterId] = useState("");
  const [sourceType, setSourceType] =
    useState<GiveVehicleSourceType>("GLOBAL_VEHICLE");
  const [vehicleId, setVehicleId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const characters = game.characters ?? [];

  const loadGlobalVehicles = useCallback(async () => {
    setLoadingGlobal(true);
    setError(null);
    try {
      const vehicles = await getOfficialVehicles();
      setGlobalVehicles(vehicles);
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to load vehicles"));
    } finally {
      setLoadingGlobal(false);
    }
  }, []);

  const loadCustomVehicles = useCallback(async () => {
    setLoadingCustom(true);
    setError(null);
    try {
      const vehicles = await fetchGameCustomVehicles(gameId);
      setCustomVehicles(vehicles);
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to load custom vehicles"));
      setCustomVehicles([]);
    } finally {
      setLoadingCustom(false);
    }
  }, [gameId]);

  const loadUniqueVehicles = useCallback(async () => {
    setLoadingUnique(true);
    setError(null);
    try {
      const vehicles = await getGameUniqueVehicles(gameId);
      setUniqueVehicles(vehicles);
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to load unique vehicles"));
      setUniqueVehicles([]);
    } finally {
      setLoadingUnique(false);
    }
  }, [gameId]);

  useEffect(() => {
    if (!isOpen) return;
    setCharacterId("");
    setError(null);
    if (lockedVehicle) {
      setSourceType(lockedVehicle.sourceType);
      setVehicleId(lockedVehicle.vehicleId);
      return;
    }
    setSourceType("GLOBAL_VEHICLE");
    setVehicleId("");
    void loadGlobalVehicles();
    void loadCustomVehicles();
    void loadUniqueVehicles();
  }, [
    isOpen,
    loadCustomVehicles,
    loadGlobalVehicles,
    loadUniqueVehicles,
    lockedVehicle,
  ]);

  useEffect(() => {
    if (lockedVehicle) return;
    setVehicleId("");
  }, [sourceType, lockedVehicle]);

  const vehicleOptions: GiveVehicleOption[] =
    sourceType === "GLOBAL_VEHICLE"
      ? globalVehicles
          .filter((vehicle): vehicle is ResolvedVehicle & { id: string } =>
            Boolean(vehicle.id)
          )
          .map((vehicle) => ({
            sourceType: "GLOBAL_VEHICLE" as const,
            vehicleId: vehicle.id,
            label: vehicleLabel(vehicle),
          }))
      : sourceType === "CUSTOM_VEHICLE"
        ? customVehicles.map((vehicle) => ({
            sourceType: "CUSTOM_VEHICLE" as const,
            vehicleId: vehicle.id,
            label: vehicleLabel(vehicle),
          }))
        : uniqueVehicles.map((vehicle) => ({
            sourceType: "UNIQUE_VEHICLE" as const,
            vehicleId: vehicle.id,
            label: vehicle.name?.trim() || "Unnamed unique vehicle",
          }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitSourceType = lockedVehicle?.sourceType ?? sourceType;
    const submitVehicleId = lockedVehicle?.vehicleId ?? vehicleId;
    if (!characterId || !submitVehicleId) {
      setError("Select a character and a vehicle.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await giveVehicleToCharacter(gameId, {
        characterId,
        sourceType: submitSourceType,
        vehicleId: submitVehicleId,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(getUserSafeErrorMessage(err, "Failed to give vehicle"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCharacterId("");
    if (lockedVehicle) {
      setSourceType(lockedVehicle.sourceType);
      setVehicleId(lockedVehicle.vehicleId);
    } else {
      setSourceType("GLOBAL_VEHICLE");
      setVehicleId("");
    }
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const characterDisplayName = (c: (typeof characters)[0]) =>
    [c.character.name, c.character.surname].filter(Boolean).join(" ").trim() ||
    "Unnamed";

  const characterOptions: ModalSelectOption[] = characters.map((gc) => ({
    value: gc.character.id,
    label: characterDisplayName(gc),
  }));

  const sourceTypeOptions: ModalSelectOption[] = [
    { value: "GLOBAL_VEHICLE", label: "Official vehicle" },
    { value: "CUSTOM_VEHICLE", label: "Custom vehicle" },
    { value: "UNIQUE_VEHICLE", label: "Unique vehicle" },
  ];

  const selectVehicleOptions: ModalSelectOption[] = vehicleOptions.map(
    (option) => ({
      value: option.vehicleId,
      label: option.label,
    })
  );

  const vehicleSelectPlaceholder =
    sourceType === "GLOBAL_VEHICLE"
      ? loadingGlobal
        ? "Loading…"
        : globalVehicles.length === 0
          ? "No official vehicles"
          : "Select vehicle"
      : sourceType === "CUSTOM_VEHICLE"
        ? loadingCustom
          ? "Loading…"
          : customVehicles.length === 0
            ? "No custom vehicles"
            : "Select vehicle"
        : loadingUnique
          ? "Loading…"
          : uniqueVehicles.length === 0
            ? "No unique vehicles"
            : "Select vehicle";

  const resolvedVehicleId = lockedVehicle?.vehicleId ?? vehicleId;
  const sourceLoading =
    (sourceType === "GLOBAL_VEHICLE" &&
      (loadingGlobal || globalVehicles.length === 0)) ||
    (sourceType === "CUSTOM_VEHICLE" &&
      (loadingCustom || customVehicles.length === 0)) ||
    (sourceType === "UNIQUE_VEHICLE" &&
      (loadingUnique || uniqueVehicles.length === 0));

  return (
    <ModalShell
      isOpen
      onClose={handleClose}
      title="Give vehicle to character"
      titleId="give-vehicle-title"
      subtitle={
        lockedVehicle
          ? `Add “${lockedVehicle.vehicleName}” to a character’s garage.`
          : "Choose a character and a vehicle to add to their garage."
      }
      closeDisabled={submitting}
      zIndexClass="z-[70]"
      maxWidthClass="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="modalFooterSecondary"
            fullWidth={false}
            className="!border-white/50 font-medium"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="give-vehicle-modal-form"
            variant="modalFooterPrimary"
            fullWidth={false}
            className="font-medium !text-modalBackground-200 disabled:pointer-events-none"
            disabled={
              submitting ||
              !characterId ||
              !resolvedVehicleId ||
              characters.length === 0
            }
          >
            {submitting ? "Giving…" : "Give vehicle"}
          </Button>
        </div>
      }
    >
      <form
        id="give-vehicle-modal-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        <ModalSelect
          id="give-vehicle-character"
          label="Character"
          placeholder={
            characters.length === 0
              ? "No characters in game"
              : "Select character"
          }
          value={characterId}
          options={characterOptions}
          disabled={submitting || characters.length === 0}
          onChange={setCharacterId}
        />

        {lockedVehicle ? (
          <div>
            <span className="mb-1 block text-sm font-medium text-white">
              Vehicle
            </span>
            <p className="rounded-md border border-white/20 bg-paleBlue/10 px-3 py-2 text-sm text-white">
              {lockedVehicle.vehicleName}
            </p>
          </div>
        ) : (
          <>
            <ModalSelect
              id="give-vehicle-source"
              label="Vehicle type"
              placeholder="Vehicle type"
              value={sourceType}
              options={sourceTypeOptions}
              disabled={submitting}
              onChange={(value) =>
                setSourceType(value as GiveVehicleSourceType)
              }
            />

            <ModalSelect
              id="give-vehicle-vehicle"
              label="Vehicle"
              placeholder={vehicleSelectPlaceholder}
              value={vehicleId}
              options={selectVehicleOptions}
              disabled={submitting || sourceLoading}
              onChange={setVehicleId}
            />
          </>
        )}

        {error ? (
          <p className="break-words text-sm text-red-300">{error}</p>
        ) : null}
      </form>
    </ModalShell>
  );
}
