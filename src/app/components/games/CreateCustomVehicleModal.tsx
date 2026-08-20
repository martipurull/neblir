"use client";

import { GameModalRichTextField } from "@/app/components/games/shared/GameModalRichTextField";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { ImageUploadDropzone } from "@/app/components/shared/ImageUploadDropzone";
import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { TextField } from "@/app/components/shared/TextField";
import {
  customVehicleCreateSchema,
  customVehicleUpdateSchema,
  type CustomVehicleResponse,
  type VehicleLocomotion,
  type VehicleSizeCategory,
} from "@/app/lib/types/vehicle";
import {
  VEHICLE_ACCELERATION_LABEL,
  VEHICLE_COMBAT_SPEED_HELP,
  VEHICLE_COMBAT_SPEED_LABEL,
  VEHICLE_MANOEUVRABILITY_LABEL,
  VEHICLE_TRAVEL_SPEED_HELP,
  VEHICLE_TRAVEL_SPEED_LABEL,
} from "@/app/lib/constants/vehicleFields";
import { useImageUpload } from "@/hooks/use-image-upload";
import {
  getGameCustomVehicleRecord,
  updateGameCustomVehicle,
} from "@/lib/api/customVehicles";
import {
  getUserSafeApiError,
  getUserSafeErrorMessage,
} from "@/lib/userSafeError";
import { useCallback, useEffect, useState } from "react";

const sizeOptions = [
  { value: "LIGHT", label: "Light" },
  { value: "STANDARD", label: "Standard" },
  { value: "HEAVY", label: "Heavy" },
] as const;

const locomotionOptions: Array<{ value: VehicleLocomotion; label: string }> = [
  { value: "LAND", label: "Land" },
  { value: "AIR", label: "Air" },
  { value: "SEA", label: "Sea" },
  { value: "SNOW", label: "Snow" },
];

type Props = {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  editCustomVehicleId?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

function optionalNum(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function requiredInt(value: string): number {
  return Number.parseInt(value.trim(), 10);
}

function customVehicleToForm(vehicle: CustomVehicleResponse) {
  return {
    name: vehicle.name,
    brand: vehicle.brand ?? "",
    year: vehicle.year != null ? String(vehicle.year) : "",
    imageKey: vehicle.imageKey ?? "",
    confCost: vehicle.confCost != null ? String(vehicle.confCost) : "",
    costInfo: vehicle.costInfo ?? "",
    description: vehicle.description ?? "",
    notes: vehicle.notes ?? "",
    maxHp: String(vehicle.maxHp),
    travelSpeedKmh: String(vehicle.travelSpeedKmh),
    combatSpeedMetres: String(vehicle.combatSpeedMetres),
    manoeuvrability: String(vehicle.manoeuvrability),
    acceleration: String(vehicle.acceleration),
    weight: vehicle.weight != null ? String(vehicle.weight) : "",
    heightMetres:
      vehicle.heightMetres != null ? String(vehicle.heightMetres) : "",
    maxCargoWeightKg:
      vehicle.maxCargoWeightKg != null ? String(vehicle.maxCargoWeightKg) : "",
    maxMountedItems:
      vehicle.maxMountedItems != null ? String(vehicle.maxMountedItems) : "",
    maxPassengers: String(vehicle.maxPassengers),
    vehicleSizeCategory: vehicle.vehicleSizeCategory,
    locomotionModes: vehicle.locomotionModes,
    membersCanModify: vehicle.membersCanModify === true,
  };
}

export function CreateCustomVehicleModal({
  isOpen,
  gameId,
  gameName,
  editCustomVehicleId = null,
  onClose,
  onSuccess,
}: Props) {
  const isEdit = Boolean(editCustomVehicleId);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [year, setYear] = useState("");
  const [confCost, setConfCost] = useState("");
  const [costInfo, setCostInfo] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [maxHp, setMaxHp] = useState("1");
  const [travelSpeedKmh, setTravelSpeedKmh] = useState("1");
  const [combatSpeedMetres, setCombatSpeedMetres] = useState("1");
  const [manoeuvrability, setManoeuvrability] = useState("0");
  const [acceleration, setAcceleration] = useState("1");
  const [weight, setWeight] = useState("");
  const [heightMetres, setHeightMetres] = useState("");
  const [maxCargoWeightKg, setMaxCargoWeightKg] = useState("");
  const [maxMountedItems, setMaxMountedItems] = useState("");
  const [maxPassengers, setMaxPassengers] = useState("1");
  const [vehicleSizeCategory, setVehicleSizeCategory] =
    useState<VehicleSizeCategory>("LIGHT");
  const [locomotionModes, setLocomotionModes] = useState<VehicleLocomotion[]>([
    "LAND",
  ]);
  const [membersCanModify, setMembersCanModify] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [richTextSyncKey, setRichTextSyncKey] = useState(0);
  const imageUpload = useImageUpload("custom_vehicles");
  const {
    imageKey,
    setImageKey,
    setPendingImageKey,
    handleFile,
    handleDrop,
    handleDragOver,
    uploading,
    uploadError,
    reset: resetImageUpload,
  } = imageUpload;

  const resetForm = useCallback(() => {
    setName("");
    setBrand("");
    setYear("");
    setConfCost("");
    setCostInfo("");
    setDescription("");
    setNotes("");
    setMaxHp("1");
    setTravelSpeedKmh("1");
    setCombatSpeedMetres("1");
    setManoeuvrability("0");
    setAcceleration("1");
    setWeight("");
    setHeightMetres("");
    setMaxCargoWeightKg("");
    setMaxMountedItems("");
    setMaxPassengers("1");
    setVehicleSizeCategory("LIGHT");
    setLocomotionModes(["LAND"]);
    setMembersCanModify(false);
    resetImageUpload();
    setError(null);
    setDeleteError(null);
    setRichTextSyncKey((key) => key + 1);
  }, [resetImageUpload]);

  useEffect(() => {
    if (!isOpen) return;
    if (!editCustomVehicleId) {
      resetForm();
      return;
    }
    let cancelled = false;
    setLoadingEdit(true);
    setError(null);
    void (async () => {
      try {
        const vehicle = await getGameCustomVehicleRecord(
          gameId,
          editCustomVehicleId
        );
        if (cancelled) return;
        const next = customVehicleToForm(vehicle);
        setName(next.name);
        setBrand(next.brand);
        setYear(next.year);
        setConfCost(next.confCost);
        setCostInfo(next.costInfo);
        setDescription(next.description);
        setNotes(next.notes);
        setMaxHp(next.maxHp);
        setTravelSpeedKmh(next.travelSpeedKmh);
        setCombatSpeedMetres(next.combatSpeedMetres);
        setManoeuvrability(next.manoeuvrability);
        setAcceleration(next.acceleration);
        setWeight(next.weight);
        setHeightMetres(next.heightMetres);
        setMaxCargoWeightKg(next.maxCargoWeightKg);
        setMaxMountedItems(next.maxMountedItems);
        setMaxPassengers(next.maxPassengers);
        setVehicleSizeCategory(next.vehicleSizeCategory);
        setLocomotionModes(next.locomotionModes);
        setMembersCanModify(next.membersCanModify);
        setImageKey(next.imageKey);
        setPendingImageKey(next.imageKey);
        setRichTextSyncKey((key) => key + 1);
      } catch (e) {
        if (!cancelled) {
          setError(getUserSafeErrorMessage(e, "Failed to load custom vehicle"));
        }
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    editCustomVehicleId,
    gameId,
    isOpen,
    resetForm,
    setImageKey,
    setPendingImageKey,
  ]);

  const toggleLocomotion = (mode: VehicleLocomotion, checked: boolean) => {
    setLocomotionModes((current) => {
      const next = new Set(current);
      if (checked) next.add(mode);
      else next.delete(mode);
      return [...next];
    });
  };

  const buildBody = () => ({
    name: name.trim(),
    brand: brand.trim() || undefined,
    year: optionalNum(year),
    imageKey: imageKey || undefined,
    confCost: optionalNum(confCost),
    costInfo: costInfo.trim() || undefined,
    description: description.trim() || undefined,
    notes: notes.trim() || undefined,
    maxHp: requiredInt(maxHp),
    travelSpeedKmh: requiredInt(travelSpeedKmh),
    combatSpeedMetres: requiredInt(combatSpeedMetres),
    manoeuvrability: requiredInt(manoeuvrability),
    acceleration: requiredInt(acceleration),
    weight: optionalNum(weight),
    heightMetres: optionalNum(heightMetres),
    maxCargoWeightKg: optionalNum(maxCargoWeightKg),
    maxMountedItems: optionalNum(maxMountedItems),
    maxPassengers: requiredInt(maxPassengers),
    locomotionModes,
    vehicleSizeCategory,
    membersCanModify,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDeleteError(null);
    const body = buildBody();
    const parsed = (
      isEdit
        ? customVehicleUpdateSchema
        : customVehicleCreateSchema.omit({ gameId: true })
    ).safeParse(body);
    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => issue.message).join(". "));
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && editCustomVehicleId) {
        await updateGameCustomVehicle(gameId, editCustomVehicleId, parsed.data);
      } else {
        const response = await fetch(
          `/api/games/${encodeURIComponent(gameId)}/custom-vehicles`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed.data),
          }
        );
        if (!response.ok) {
          let bodyPayload: { message?: string; details?: string } | undefined;
          try {
            bodyPayload = (await response.json()) as {
              message?: string;
              details?: string;
            };
          } catch {
            // ignore
          }
          throw new Error(
            getUserSafeApiError(
              response.status,
              bodyPayload,
              "Failed to create custom vehicle"
            )
          );
        }
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(getUserSafeErrorMessage(err, "Failed to save custom vehicle"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editCustomVehicleId) return;
    if (!window.confirm("Delete this custom vehicle?")) return;
    setDeleteError(null);
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/games/${encodeURIComponent(gameId)}/custom-vehicles/${encodeURIComponent(editCustomVehicleId)}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        let bodyPayload: { message?: string; details?: string } | undefined;
        try {
          bodyPayload = (await response.json()) as {
            message?: string;
            details?: string;
          };
        } catch {
          // ignore
        }
        throw new Error(
          getUserSafeApiError(
            response.status,
            bodyPayload,
            "Failed to delete custom vehicle"
          )
        );
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setDeleteError(
        getUserSafeErrorMessage(err, "Failed to delete custom vehicle")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GameFormModal
      isOpen={isOpen}
      title={
        isEdit
          ? `Edit custom vehicle — ${gameName}`
          : `Create custom vehicle — ${gameName}`
      }
      subtitle="Fields marked by validation are required. Max passengers includes the driver."
      titleId="create-custom-vehicle-title"
      error={error}
      onClose={onClose}
      onSubmit={(e) => void handleSubmit(e)}
      submitting={submitting || loadingEdit}
      submitLabel={isEdit ? "Save changes" : "Create custom vehicle"}
      submittingLabel={isEdit ? "Saving…" : "Creating…"}
    >
      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">Basics</h3>
        <div className="space-y-3">
          <div>
            <FieldLabel
              id="custom-vehicle-name"
              label="Name"
              required
              variant="dark"
            />
            <TextField
              id="custom-vehicle-name"
              type="text"
              variant="dark"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dust Runner"
              disabled={submitting || loadingEdit}
            />
          </div>
          <div>
            <FieldLabel
              id="custom-vehicle-brand"
              label="Brand"
              variant="dark"
            />
            <TextField
              id="custom-vehicle-brand"
              type="text"
              variant="dark"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Vornex"
              disabled={submitting || loadingEdit}
            />
          </div>
          <ModalNumberField
            id="custom-vehicle-year"
            label="Year"
            value={year}
            onChange={setYear}
            disabled={submitting || loadingEdit}
            required={false}
            placeholder="2099"
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">
          Description
        </h3>
        <div className="space-y-3">
          <GameModalRichTextField
            id="custom-vehicle-description"
            label="Description"
            value={description}
            onChange={setDescription}
            disabled={submitting || loadingEdit}
            syncKey={richTextSyncKey}
          />
          <GameModalRichTextField
            id="custom-vehicle-notes"
            label="Notes"
            value={notes}
            onChange={setNotes}
            disabled={submitting || loadingEdit}
            syncKey={richTextSyncKey}
          />
          <ModalNumberField
            id="custom-vehicle-conf-cost"
            label="Conf cost"
            value={confCost}
            onChange={setConfCost}
            disabled={submitting || loadingEdit}
            required={false}
            min={0}
            placeholder="0"
          />
          <div>
            <FieldLabel
              id="custom-vehicle-cost-info"
              label="Cost info"
              variant="dark"
            />
            <TextField
              id="custom-vehicle-cost-info"
              type="text"
              variant="dark"
              value={costInfo}
              onChange={(e) => setCostInfo(e.target.value)}
              placeholder="e.g. Not for sale"
              disabled={submitting || loadingEdit}
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">Stats</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <ModalNumberField
            id="custom-vehicle-max-hp"
            label="Max HP"
            value={maxHp}
            onChange={setMaxHp}
            disabled={submitting || loadingEdit}
            min={1}
            placeholder="1"
          />
          <ModalNumberField
            id="custom-vehicle-manoeuvrability"
            label={VEHICLE_MANOEUVRABILITY_LABEL}
            value={manoeuvrability}
            onChange={setManoeuvrability}
            disabled={submitting || loadingEdit}
            placeholder="0"
          />
          <ModalNumberField
            id="custom-vehicle-acceleration"
            label={VEHICLE_ACCELERATION_LABEL}
            value={acceleration}
            onChange={setAcceleration}
            disabled={submitting || loadingEdit}
            min={1}
            placeholder="1"
          />
          <ModalNumberField
            id="custom-vehicle-travel-speed"
            label={VEHICLE_TRAVEL_SPEED_LABEL}
            hint={VEHICLE_TRAVEL_SPEED_HELP}
            value={travelSpeedKmh}
            onChange={setTravelSpeedKmh}
            disabled={submitting || loadingEdit}
            min={1}
            placeholder="1"
          />
          <ModalNumberField
            id="custom-vehicle-combat-speed"
            label={VEHICLE_COMBAT_SPEED_LABEL}
            hint={VEHICLE_COMBAT_SPEED_HELP}
            value={combatSpeedMetres}
            onChange={setCombatSpeedMetres}
            disabled={submitting || loadingEdit}
            min={1}
            placeholder="1"
          />
          <ModalNumberField
            id="custom-vehicle-max-passengers"
            label="Max passengers (incl. driver)"
            value={maxPassengers}
            onChange={setMaxPassengers}
            disabled={submitting || loadingEdit}
            min={1}
            placeholder="1"
          />
          <ModalNumberField
            id="custom-vehicle-max-mounted-items"
            label="Max mounted items"
            value={maxMountedItems}
            onChange={setMaxMountedItems}
            disabled={submitting || loadingEdit}
            required={false}
            min={0}
            placeholder="0"
          />
          <ModalNumberField
            id="custom-vehicle-weight"
            label="Weight kg"
            value={weight}
            onChange={setWeight}
            disabled={submitting || loadingEdit}
            required={false}
            min={0}
            step={0.1}
            placeholder="0"
          />
          <ModalNumberField
            id="custom-vehicle-height"
            label="Height metres"
            value={heightMetres}
            onChange={setHeightMetres}
            disabled={submitting || loadingEdit}
            required={false}
            min={0}
            step={0.1}
            placeholder="0"
          />
          <ModalNumberField
            id="custom-vehicle-cargo"
            label="Max cargo weight kg"
            value={maxCargoWeightKg}
            onChange={setMaxCargoWeightKg}
            disabled={submitting || loadingEdit}
            required={false}
            min={0}
            step={0.1}
            placeholder="0"
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">Type</h3>
        <div className="space-y-3">
          <SelectDropdown
            id="custom-vehicle-size"
            label="Vehicle size"
            placeholder="Select vehicle size"
            value={vehicleSizeCategory}
            options={[...sizeOptions]}
            disabled={submitting || loadingEdit}
            onChange={(value) =>
              setVehicleSizeCategory(value as VehicleSizeCategory)
            }
          />
          <div>
            <FieldLabel
              id="custom-vehicle-locomotion"
              label="Locomotion modes"
              variant="dark"
              required
            />
            <div className="grid gap-2 sm:grid-cols-2">
              {locomotionOptions.map((option) => (
                <Checkbox
                  key={option.value}
                  checked={locomotionModes.includes(option.value)}
                  onChange={(checked) =>
                    toggleLocomotion(option.value, checked)
                  }
                  label={option.label}
                />
              ))}
            </div>
          </div>
          <Checkbox
            checked={membersCanModify}
            onChange={setMembersCanModify}
            disabled={submitting || loadingEdit}
            tone="inverse"
            label="Allow game members to create unique vehicles from this template"
          />
        </div>
      </section>

      <ImageUploadDropzone
        id="custom-vehicle-image"
        label="Image"
        imageKey={imageKey}
        onFileChange={(file) => void handleFile(file)}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        uploading={uploading}
        error={uploadError}
        disabled={submitting || loadingEdit}
        previewLayout="itemThumbnail"
        previewImageAlt={name.trim() ? `${name.trim()} image` : "Vehicle image"}
      />

      {isEdit ? (
        <div className="border-t border-white/10 pt-4">
          <Button
            type="button"
            variant="danger"
            fullWidth={false}
            disabled={submitting || loadingEdit}
            onClick={() => {
              void handleDelete();
            }}
          >
            Delete custom vehicle
          </Button>
          {deleteError ? (
            <p className="mt-2 text-sm text-neblirDanger-400">{deleteError}</p>
          ) : null}
        </div>
      ) : null}
    </GameFormModal>
  );
}
