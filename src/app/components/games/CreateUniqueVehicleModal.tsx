"use client";

import { GameModalRichTextField } from "@/app/components/games/shared/GameModalRichTextField";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { ImageUploadDropzone } from "@/app/components/shared/ImageUploadDropzone";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { TextField } from "@/app/components/shared/TextField";
import { TextArea } from "@/app/components/shared/TextArea";
import { useImageUpload } from "@/hooks/use-image-upload";
import {
  uniqueVehicleCreateSchema,
  uniqueVehicleUpdateSchema,
  type CustomVehicleResponse,
  type ResolvedVehicle,
  type UniqueVehicleCreate,
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
import { fetchGameCustomVehicles } from "@/lib/api/customVehicles";
import {
  createUniqueVehicle,
  getUniqueVehicleById,
  updateUniqueVehicle,
} from "@/lib/api/uniqueVehicles";
import { getOfficialVehicles } from "@/lib/api/vehicles";
import {
  getUserSafeApiError,
  getUserSafeErrorMessage,
} from "@/lib/userSafeError";
import { useEffect, useMemo, useState } from "react";

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
  /** Required when creating; optional when editing an existing unique vehicle. */
  characterId?: string;
  editUniqueVehicleId?: string | null;
  onCloseAction: () => void;
  onSuccessAction?: () => void;
};

function optionalInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function requiredInt(value: string): number {
  return Number.parseInt(value.trim(), 10);
}

function vehicleLabel(
  vehicle: ResolvedVehicle | CustomVehicleResponse
): string {
  const brand = vehicle.brand?.trim();
  return brand
    ? `${vehicle.name} — ${brand}`
    : (vehicle.name ?? "Unnamed vehicle");
}

export function CreateUniqueVehicleModal({
  isOpen,
  gameId,
  gameName,
  characterId,
  editUniqueVehicleId = null,
  onCloseAction,
  onSuccessAction,
}: Props) {
  const isEdit = Boolean(editUniqueVehicleId);
  const [creationMode, setCreationMode] = useState<"template" | "standalone">(
    "template"
  );
  const [sourceType, setSourceType] = useState<
    "GLOBAL_VEHICLE" | "CUSTOM_VEHICLE"
  >("GLOBAL_VEHICLE");
  const [vehicleId, setVehicleId] = useState("");
  const [nameOverride, setNameOverride] = useState("");
  const [brandOverride, setBrandOverride] = useState("");
  const [yearOverride, setYearOverride] = useState("");
  const [confCostOverride, setConfCostOverride] = useState("");
  const [descriptionOverride, setDescriptionOverride] = useState("");
  const [notesOverride, setNotesOverride] = useState("");
  const [maxHpOverride, setMaxHpOverride] = useState("");
  const [travelSpeedKmhOverride, setTravelSpeedKmhOverride] = useState("");
  const [combatSpeedMetresOverride, setCombatSpeedMetresOverride] =
    useState("");
  const [manoeuvrabilityOverride, setManoeuvrabilityOverride] = useState("1");
  const [accelerationOverride, setAccelerationOverride] = useState("1");
  const [maxPassengersOverride, setMaxPassengersOverride] = useState("");
  const [specialTag, setSpecialTag] = useState("");
  const [vehicleSizeCategoryOverride, setVehicleSizeCategoryOverride] =
    useState<VehicleSizeCategory | "">("");
  const [overrideLocomotionModes, setOverrideLocomotionModes] = useState(false);
  const [locomotionModesOverride, setLocomotionModesOverride] = useState<
    VehicleLocomotion[]
  >(["LAND"]);

  const isStandalone = creationMode === "standalone";
  const [globalVehicles, setGlobalVehicles] = useState<ResolvedVehicle[]>([]);
  const [customVehicles, setCustomVehicles] = useState<CustomVehicleResponse[]>(
    []
  );
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [richTextSyncKey, setRichTextSyncKey] = useState(0);
  const imageUpload = useImageUpload("unique_vehicles");
  const {
    imageKey,
    setImageKey,
    setPendingImageKey,
    handleFile,
    handleDrop,
    handleDragOver,
    uploading,
    uploadError,
  } = imageUpload;

  const applyStatOverrideDefaults = () => {
    setManoeuvrabilityOverride("1");
    setAccelerationOverride("1");
  };

  const applyStandaloneDefaults = () => {
    setConfCostOverride("0");
    applyStatOverrideDefaults();
    setMaxPassengersOverride("1");
    setVehicleSizeCategoryOverride("LIGHT");
    setLocomotionModesOverride(["LAND"]);
  };

  const applyTemplateOverrideDefaults = () => {
    applyStatOverrideDefaults();
    setMaxPassengersOverride("");
  };

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const controller = new AbortController();
    setLoadingOptions(true);
    void (async () => {
      try {
        const [official, custom] = await Promise.all([
          getOfficialVehicles(controller.signal),
          fetchGameCustomVehicles(gameId, controller.signal),
        ]);
        if (cancelled) return;
        setGlobalVehicles(official);
        setCustomVehicles(custom);
      } catch (e) {
        if (!cancelled) {
          setError(
            getUserSafeErrorMessage(e, "Failed to load vehicle templates")
          );
        }
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [gameId, isOpen]);

  useEffect(() => {
    if (!isOpen || !editUniqueVehicleId) return;
    let cancelled = false;
    setLoadingEdit(true);
    setError(null);
    void (async () => {
      try {
        const detail = await getUniqueVehicleById(editUniqueVehicleId);
        if (cancelled) return;
        setCreationMode(
          detail.sourceType === "STANDALONE" ? "standalone" : "template"
        );
        if (detail.sourceType === "STANDALONE") {
          setConfCostOverride(
            detail.confCostOverride != null
              ? String(detail.confCostOverride)
              : ""
          );
          setDescriptionOverride(detail.descriptionOverride ?? "");
          setAccelerationOverride(
            detail.accelerationOverride != null
              ? String(detail.accelerationOverride)
              : "1"
          );
          setVehicleSizeCategoryOverride(
            detail.vehicleSizeCategoryOverride ?? "LIGHT"
          );
          setLocomotionModesOverride(
            detail.locomotionModesOverride?.length
              ? detail.locomotionModesOverride
              : ["LAND"]
          );
          setOverrideLocomotionModes(false);
        } else {
          setSourceType(
            detail.sourceType === "CUSTOM_VEHICLE"
              ? "CUSTOM_VEHICLE"
              : "GLOBAL_VEHICLE"
          );
          setVehicleId(detail.vehicleId ?? "");
        }
        setNameOverride(detail.nameOverride ?? "");
        setNotesOverride(detail.notesOverride ?? "");
        setImageKey(detail.imageKeyOverride ?? "");
        setPendingImageKey(detail.imageKeyOverride ?? "");
        setRichTextSyncKey((key) => key + 1);
        setBrandOverride(detail.brandOverride ?? "");
        setYearOverride(
          detail.yearOverride != null ? String(detail.yearOverride) : ""
        );
        setMaxHpOverride(
          detail.maxHpOverride != null ? String(detail.maxHpOverride) : ""
        );
        setTravelSpeedKmhOverride(
          detail.travelSpeedKmhOverride != null
            ? String(detail.travelSpeedKmhOverride)
            : ""
        );
        setCombatSpeedMetresOverride(
          detail.combatSpeedMetresOverride != null
            ? String(detail.combatSpeedMetresOverride)
            : ""
        );
        setManoeuvrabilityOverride(
          detail.manoeuvrabilityOverride != null
            ? String(detail.manoeuvrabilityOverride)
            : ""
        );
        setAccelerationOverride(
          detail.accelerationOverride != null
            ? String(detail.accelerationOverride)
            : ""
        );
        setMaxPassengersOverride(
          detail.maxPassengersOverride != null
            ? String(detail.maxPassengersOverride)
            : ""
        );
        setSpecialTag(detail.specialTag ?? "");
        if (detail.sourceType !== "STANDALONE") {
          setVehicleSizeCategoryOverride(
            detail.vehicleSizeCategoryOverride ?? ""
          );
          const nextModes = detail.locomotionModesOverride ?? [];
          setOverrideLocomotionModes(nextModes.length > 0);
          setLocomotionModesOverride(nextModes);
        }
      } catch (e) {
        if (!cancelled) {
          setError(getUserSafeErrorMessage(e, "Failed to load unique vehicle"));
        }
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editUniqueVehicleId, isOpen, setImageKey, setPendingImageKey]);

  const templateOptions = useMemo(() => {
    const list =
      sourceType === "GLOBAL_VEHICLE" ? globalVehicles : customVehicles;
    return list
      .filter((vehicle): vehicle is typeof vehicle & { id: string } =>
        Boolean(vehicle.id)
      )
      .map((vehicle) => ({
        value: vehicle.id,
        label: vehicleLabel(vehicle),
      }));
  }, [customVehicles, globalVehicles, sourceType]);

  const selectedTemplate = useMemo(() => {
    const list =
      sourceType === "GLOBAL_VEHICLE" ? globalVehicles : customVehicles;
    return list.find((vehicle) => vehicle.id === vehicleId) ?? null;
  }, [customVehicles, globalVehicles, sourceType, vehicleId]);

  const toggleLocomotion = (mode: VehicleLocomotion, checked: boolean) => {
    setLocomotionModesOverride((current) => {
      const next = new Set(current);
      if (checked) next.add(mode);
      else next.delete(mode);
      return [...next];
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setDeleteError(null);

    const templateBody = {
      sourceType,
      vehicleId,
      gameId,
      nameOverride: nameOverride.trim() || undefined,
      brandOverride: brandOverride.trim() || undefined,
      yearOverride: optionalInt(yearOverride),
      imageKeyOverride: imageKey || undefined,
      notesOverride: notesOverride.trim() || undefined,
      maxHpOverride: optionalInt(maxHpOverride),
      travelSpeedKmhOverride: optionalInt(travelSpeedKmhOverride),
      combatSpeedMetresOverride: optionalInt(combatSpeedMetresOverride),
      manoeuvrabilityOverride: optionalInt(manoeuvrabilityOverride),
      accelerationOverride: optionalInt(accelerationOverride),
      maxPassengersOverride: optionalInt(maxPassengersOverride),
      specialTag: specialTag.trim() || undefined,
      vehicleSizeCategoryOverride: vehicleSizeCategoryOverride || undefined,
      locomotionModesOverride: overrideLocomotionModes
        ? locomotionModesOverride
        : undefined,
    };

    const standaloneBody = {
      sourceType: "STANDALONE" as const,
      gameId,
      nameOverride: nameOverride.trim(),
      brandOverride: brandOverride.trim() || undefined,
      yearOverride: optionalInt(yearOverride),
      confCostOverride: requiredInt(confCostOverride),
      descriptionOverride: descriptionOverride.trim(),
      notesOverride: notesOverride.trim() || undefined,
      imageKeyOverride: imageKey || undefined,
      maxHpOverride: requiredInt(maxHpOverride),
      travelSpeedKmhOverride: requiredInt(travelSpeedKmhOverride),
      combatSpeedMetresOverride: requiredInt(combatSpeedMetresOverride),
      manoeuvrabilityOverride: requiredInt(manoeuvrabilityOverride),
      accelerationOverride: requiredInt(accelerationOverride),
      maxPassengersOverride: requiredInt(maxPassengersOverride),
      locomotionModesOverride: locomotionModesOverride,
      vehicleSizeCategoryOverride:
        vehicleSizeCategoryOverride || ("LIGHT" as VehicleSizeCategory),
      specialTag: specialTag.trim() || undefined,
    };

    const body = isStandalone ? standaloneBody : templateBody;

    const parsed = (
      isEdit ? uniqueVehicleUpdateSchema : uniqueVehicleCreateSchema
    ).safeParse(
      isEdit
        ? {
            ...body,
            gameId: undefined,
            sourceType: undefined,
            vehicleId: undefined,
          }
        : body
    );

    if (!parsed.success) {
      setError(parsed.error.issues.map((issue) => issue.message).join(". "));
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && editUniqueVehicleId) {
        await updateUniqueVehicle(editUniqueVehicleId, parsed.data);
      } else if (characterId) {
        const response = await fetch(
          `/api/characters/${encodeURIComponent(characterId)}/unique-vehicles`,
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
              "Failed to create unique vehicle"
            )
          );
        }
      } else {
        await createUniqueVehicle(parsed.data as UniqueVehicleCreate);
      }
      onSuccessAction?.();
      onCloseAction();
    } catch (e) {
      setError(getUserSafeErrorMessage(e, "Failed to save unique vehicle"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editUniqueVehicleId) return;
    if (!window.confirm("Delete this unique vehicle?")) return;
    setDeleteError(null);
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/unique-vehicles/${encodeURIComponent(editUniqueVehicleId)}`,
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
            "Failed to delete unique vehicle"
          )
        );
      }
      onSuccessAction?.();
      onCloseAction();
    } catch (e) {
      setDeleteError(
        getUserSafeErrorMessage(e, "Failed to delete unique vehicle")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled = isStandalone
    ? !nameOverride.trim() ||
      !confCostOverride.trim() ||
      !descriptionOverride.trim() ||
      !maxHpOverride.trim() ||
      !travelSpeedKmhOverride.trim() ||
      !combatSpeedMetresOverride.trim() ||
      !manoeuvrabilityOverride.trim() ||
      !accelerationOverride.trim() ||
      !maxPassengersOverride.trim() ||
      !vehicleSizeCategoryOverride ||
      locomotionModesOverride.length === 0
    : (!isEdit && !vehicleId) ||
      (overrideLocomotionModes && locomotionModesOverride.length === 0);

  return (
    <GameFormModal
      isOpen={isOpen}
      title={
        isEdit
          ? `Edit unique vehicle — ${gameName}`
          : `Create unique vehicle — ${gameName}`
      }
      subtitle={
        isStandalone
          ? characterId
            ? "Define a one-of-a-kind vehicle with no catalogue template. It is added to this character’s garage."
            : "Define a one-of-a-kind vehicle with no catalogue template. Use Give vehicle to character afterward to add it to a garage."
          : characterId
            ? "Choose a template from the global catalogue or the active game’s custom vehicles, then add any overrides you want. The vehicle is added to this character’s garage."
            : "Choose a template from the global catalogue or this game’s custom vehicles, then add any overrides you want. Use Give vehicle to character afterward to add it to a garage."
      }
      titleId="create-unique-vehicle-title"
      error={error}
      onClose={onCloseAction}
      onSubmit={(e) => void handleSubmit(e)}
      submitting={submitting || loadingEdit || loadingOptions}
      submitLabel={isEdit ? "Save changes" : "Create unique vehicle"}
      submittingLabel={isEdit ? "Saving…" : "Creating…"}
      submitDisabled={submitDisabled}
    >
      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">Origin</h3>
        <div className="space-y-3">
          {!isEdit ? (
            <SelectDropdown
              id="unique-vehicle-creation-mode"
              label="Creation mode"
              placeholder="Select mode"
              value={creationMode}
              options={[
                { value: "template", label: "From template" },
                {
                  value: "standalone",
                  label: "No template (standalone vehicle)",
                },
              ]}
              disabled={submitting || loadingEdit}
              onChange={(value) => {
                const nextMode = value as "template" | "standalone";
                setCreationMode(nextMode);
                setVehicleId("");
                if (nextMode === "standalone") {
                  applyStandaloneDefaults();
                } else {
                  applyTemplateOverrideDefaults();
                }
              }}
            />
          ) : null}
          {!isStandalone ? (
            <>
              <SelectDropdown
                id="unique-vehicle-source-type"
                label="Template source"
                placeholder="Select source"
                value={sourceType}
                options={[
                  { value: "GLOBAL_VEHICLE", label: "Official vehicle" },
                  {
                    value: "CUSTOM_VEHICLE",
                    label: `Custom vehicle in ${gameName}`,
                  },
                ]}
                disabled={submitting || loadingEdit || isEdit}
                onChange={(value) => {
                  setSourceType(value as "GLOBAL_VEHICLE" | "CUSTOM_VEHICLE");
                  setVehicleId("");
                }}
              />
              <SelectDropdown
                id="unique-vehicle-template"
                label="Template vehicle"
                placeholder={
                  loadingOptions ? "Loading vehicles…" : "Select vehicle"
                }
                value={vehicleId}
                options={templateOptions}
                disabled={
                  submitting ||
                  loadingEdit ||
                  loadingOptions ||
                  templateOptions.length === 0 ||
                  isEdit
                }
                onChange={setVehicleId}
                menuMaxHeightClass="max-h-64"
              />
              {selectedTemplate ? (
                <div className="rounded-md border border-white/20 bg-white/5 px-3 py-2 text-xs text-white/75">
                  {selectedTemplate.maxHp ?? "—"} HP ·{" "}
                  {selectedTemplate.combatSpeedMetres ?? "—"}m combat ·{" "}
                  {selectedTemplate.travelSpeedKmh ?? "—"}km/h travel ·
                  Manoeuvrability {selectedTemplate.manoeuvrability ?? "—"} ·
                  Acceleration {selectedTemplate.acceleration ?? "—"}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">
          {isStandalone ? "Vehicle details" : "Overrides"}
        </h3>
        <div className="space-y-3">
          <div>
            <FieldLabel
              id="unique-vehicle-name-override"
              label={isStandalone ? "Name" : "Name override"}
              variant="dark"
              required={isStandalone}
            />
            <TextField
              id="unique-vehicle-name-override"
              type="text"
              variant="dark"
              value={nameOverride}
              onChange={(e) => setNameOverride(e.target.value)}
              placeholder={
                isStandalone
                  ? "Vehicle name"
                  : "Leave blank to use template name"
              }
              disabled={submitting || loadingEdit}
            />
          </div>
          {isStandalone ? (
            <>
              <ModalNumberField
                id="unique-vehicle-conf-cost"
                label="CONF cost"
                value={confCostOverride}
                onChange={setConfCostOverride}
                disabled={submitting || loadingEdit}
                min={0}
                placeholder="0"
              />
              <div>
                <FieldLabel
                  id="unique-vehicle-description"
                  label="Description"
                  variant="dark"
                  required
                />
                <TextArea
                  id="unique-vehicle-description"
                  variant="dark"
                  value={descriptionOverride}
                  onChange={(e) => setDescriptionOverride(e.target.value)}
                  rows={4}
                  disabled={submitting || loadingEdit}
                />
              </div>
            </>
          ) : null}
          <div>
            <FieldLabel
              id="unique-vehicle-brand-override"
              label="Brand override"
              variant="dark"
            />
            <TextField
              id="unique-vehicle-brand-override"
              type="text"
              variant="dark"
              value={brandOverride}
              onChange={(e) => setBrandOverride(e.target.value)}
              placeholder="Optional"
              disabled={submitting || loadingEdit}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ModalNumberField
              id="unique-vehicle-year-override"
              label="Year override"
              value={yearOverride}
              onChange={setYearOverride}
              disabled={submitting || loadingEdit}
              required={false}
              placeholder="Optional"
            />
            <ModalNumberField
              id="unique-vehicle-max-hp-override"
              label={isStandalone ? "Max HP" : "Max HP override"}
              value={maxHpOverride}
              onChange={setMaxHpOverride}
              disabled={submitting || loadingEdit}
              required={isStandalone}
              min={1}
              placeholder={isStandalone ? "1" : "Optional"}
            />
            <ModalNumberField
              id="unique-vehicle-combat-speed-override"
              label={
                isStandalone
                  ? VEHICLE_COMBAT_SPEED_LABEL
                  : "Combat speed override"
              }
              hint={isStandalone ? VEHICLE_COMBAT_SPEED_HELP : undefined}
              value={combatSpeedMetresOverride}
              onChange={setCombatSpeedMetresOverride}
              disabled={submitting || loadingEdit}
              required={isStandalone}
              min={1}
              placeholder={isStandalone ? "1" : "Optional"}
            />
            <ModalNumberField
              id="unique-vehicle-travel-speed-override"
              label={
                isStandalone
                  ? VEHICLE_TRAVEL_SPEED_LABEL
                  : "Travel speed override"
              }
              hint={isStandalone ? VEHICLE_TRAVEL_SPEED_HELP : undefined}
              value={travelSpeedKmhOverride}
              onChange={setTravelSpeedKmhOverride}
              disabled={submitting || loadingEdit}
              required={isStandalone}
              min={1}
              placeholder={isStandalone ? "1" : "Optional"}
            />
            <ModalNumberField
              id="unique-vehicle-manoeuvrability-override"
              label={
                isStandalone
                  ? VEHICLE_MANOEUVRABILITY_LABEL
                  : "Manoeuvrability override"
              }
              value={manoeuvrabilityOverride}
              onChange={setManoeuvrabilityOverride}
              disabled={submitting || loadingEdit}
              required={isStandalone}
              placeholder={isStandalone ? "1" : "Optional"}
            />
            <ModalNumberField
              id="unique-vehicle-acceleration-override"
              label={
                isStandalone
                  ? VEHICLE_ACCELERATION_LABEL
                  : "Acceleration override"
              }
              value={accelerationOverride}
              onChange={setAccelerationOverride}
              disabled={submitting || loadingEdit}
              required={isStandalone}
              min={1}
              placeholder={isStandalone ? "1" : "Optional"}
            />
            <ModalNumberField
              id="unique-vehicle-passengers-override"
              label={
                isStandalone
                  ? "Max passengers (incl. driver)"
                  : "Max passengers override"
              }
              value={maxPassengersOverride}
              onChange={setMaxPassengersOverride}
              disabled={submitting || loadingEdit}
              required={isStandalone}
              min={1}
              placeholder={isStandalone ? "1" : "Optional"}
            />
          </div>
          <div>
            <FieldLabel
              id="unique-vehicle-special-tag"
              label="Special tag"
              variant="dark"
            />
            <TextField
              id="unique-vehicle-special-tag"
              type="text"
              variant="dark"
              value={specialTag}
              onChange={(e) => setSpecialTag(e.target.value)}
              placeholder="Optional"
              disabled={submitting || loadingEdit}
            />
          </div>
          <div>
            <FieldLabel
              id="unique-vehicle-size-override"
              label={isStandalone ? "Vehicle size" : "Vehicle size override"}
              variant="dark"
              required={isStandalone}
            />
            <SelectDropdown
              id="unique-vehicle-size-override"
              label={isStandalone ? "Vehicle size" : "Vehicle size override"}
              showLabel={false}
              placeholder={isStandalone ? "Select size" : "Leave unchanged"}
              value={vehicleSizeCategoryOverride}
              options={[...sizeOptions]}
              disabled={submitting || loadingEdit}
              onChange={(value) =>
                setVehicleSizeCategoryOverride(value as VehicleSizeCategory)
              }
            />
            {!isStandalone && vehicleSizeCategoryOverride ? (
              <Button
                type="button"
                variant="modalInlineLink"
                fullWidth={false}
                className="mt-2"
                disabled={submitting || loadingEdit}
                onClick={() => setVehicleSizeCategoryOverride("")}
              >
                Clear size override
              </Button>
            ) : null}
          </div>
          {isStandalone ? (
            <div>
              <FieldLabel
                id="unique-vehicle-locomotion-modes"
                label="Locomotion modes"
                variant="dark"
                required
              />
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {locomotionOptions.map((option) => (
                  <Checkbox
                    key={option.value}
                    checked={locomotionModesOverride.includes(option.value)}
                    onChange={(checked) =>
                      toggleLocomotion(option.value, checked)
                    }
                    label={option.label}
                    disabled={submitting || loadingEdit}
                    tone="inverse"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <Checkbox
                checked={overrideLocomotionModes}
                onChange={(checked) => {
                  setOverrideLocomotionModes(checked);
                  if (!checked) setLocomotionModesOverride([]);
                }}
                label="Override locomotion modes"
                disabled={submitting || loadingEdit}
                tone="inverse"
              />
              {overrideLocomotionModes ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {locomotionOptions.map((option) => (
                    <Checkbox
                      key={option.value}
                      checked={locomotionModesOverride.includes(option.value)}
                      onChange={(checked) =>
                        toggleLocomotion(option.value, checked)
                      }
                      label={option.label}
                      disabled={submitting || loadingEdit}
                      tone="inverse"
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )}
          <GameModalRichTextField
            id="unique-vehicle-notes-override"
            label={isStandalone ? "Notes" : "Notes override"}
            value={notesOverride}
            onChange={setNotesOverride}
            disabled={submitting || loadingEdit}
            syncKey={richTextSyncKey}
          />
        </div>
      </section>

      <ImageUploadDropzone
        id="unique-vehicle-image-override"
        label={isStandalone ? "Image" : "Image override"}
        imageKey={imageKey}
        onFileChange={(file) => void handleFile(file)}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        uploading={uploading}
        error={uploadError}
        disabled={submitting || loadingEdit}
        previewLayout="itemThumbnail"
        previewImageAlt={
          nameOverride.trim() ? `${nameOverride.trim()} image` : "Vehicle image"
        }
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
            Delete unique vehicle
          </Button>
          {deleteError ? (
            <p className="mt-2 text-sm text-neblirDanger-400">{deleteError}</p>
          ) : null}
        </div>
      ) : null}
    </GameFormModal>
  );
}
