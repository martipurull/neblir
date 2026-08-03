"use client";

import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { GameFormModal } from "@/app/components/games/shared/GameFormModal";
import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { TextField } from "@/app/components/shared/TextField";
import {
  uniqueVehicleCreateSchema,
  uniqueVehicleUpdateSchema,
  type CustomVehicleResponse,
  type ResolvedVehicle,
  type VehicleLocomotion,
  type VehicleSizeCategory,
} from "@/app/lib/types/vehicle";
import { fetchGameCustomVehicles } from "@/lib/api/customVehicles";
import {
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
  const [sourceType, setSourceType] = useState<
    "GLOBAL_VEHICLE" | "CUSTOM_VEHICLE"
  >("GLOBAL_VEHICLE");
  const [vehicleId, setVehicleId] = useState("");
  const [nameOverride, setNameOverride] = useState("");
  const [brandOverride, setBrandOverride] = useState("");
  const [yearOverride, setYearOverride] = useState("");
  const [maxHpOverride, setMaxHpOverride] = useState("");
  const [travelSpeedKmhOverride, setTravelSpeedKmhOverride] = useState("");
  const [combatSpeedMetresOverride, setCombatSpeedMetresOverride] =
    useState("");
  const [manoeuvrabilityOverride, setManoeuvrabilityOverride] = useState("");
  const [maxPassengersOverride, setMaxPassengersOverride] = useState("");
  const [specialTag, setSpecialTag] = useState("");
  const [vehicleSizeCategoryOverride, setVehicleSizeCategoryOverride] =
    useState<VehicleSizeCategory | "">("");
  const [overrideLocomotionModes, setOverrideLocomotionModes] = useState(false);
  const [locomotionModesOverride, setLocomotionModesOverride] = useState<
    VehicleLocomotion[]
  >([]);
  const [globalVehicles, setGlobalVehicles] = useState<ResolvedVehicle[]>([]);
  const [customVehicles, setCustomVehicles] = useState<CustomVehicleResponse[]>(
    []
  );
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
        setSourceType(detail.sourceType);
        setVehicleId(detail.vehicleId);
        setNameOverride(detail.nameOverride ?? "");
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
        setMaxPassengersOverride(
          detail.maxPassengersOverride != null
            ? String(detail.maxPassengersOverride)
            : ""
        );
        setSpecialTag(detail.specialTag ?? "");
        setVehicleSizeCategoryOverride(
          detail.vehicleSizeCategoryOverride ?? ""
        );
        const nextModes = detail.locomotionModesOverride ?? [];
        setOverrideLocomotionModes(nextModes.length > 0);
        setLocomotionModesOverride(nextModes);
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
  }, [editUniqueVehicleId, isOpen]);

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

    const body = {
      sourceType,
      vehicleId,
      gameId,
      nameOverride: nameOverride.trim() || undefined,
      brandOverride: brandOverride.trim() || undefined,
      yearOverride: optionalInt(yearOverride),
      maxHpOverride: optionalInt(maxHpOverride),
      travelSpeedKmhOverride: optionalInt(travelSpeedKmhOverride),
      combatSpeedMetresOverride: optionalInt(combatSpeedMetresOverride),
      manoeuvrabilityOverride: optionalInt(manoeuvrabilityOverride),
      maxPassengersOverride: optionalInt(maxPassengersOverride),
      specialTag: specialTag.trim() || undefined,
      vehicleSizeCategoryOverride: vehicleSizeCategoryOverride || undefined,
      locomotionModesOverride: overrideLocomotionModes
        ? locomotionModesOverride
        : undefined,
    };

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
      } else {
        if (!characterId) {
          setError("A character is required to create a unique vehicle.");
          setSubmitting(false);
          return;
        }
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

  const submitDisabled =
    (!isEdit && !vehicleId) ||
    (overrideLocomotionModes && locomotionModesOverride.length === 0);

  return (
    <GameFormModal
      isOpen={isOpen}
      title={
        isEdit
          ? `Edit unique vehicle — ${gameName}`
          : `Create unique vehicle — ${gameName}`
      }
      subtitle="Choose a template from the global catalogue or the active game’s custom vehicles, then add any overrides you want."
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
        <h3 className="mb-3 text-sm font-semibold text-white/90">Template</h3>
        <div className="space-y-3">
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
              Manoeuvrability {selectedTemplate.manoeuvrability ?? "—"}
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-white/90">Overrides</h3>
        <div className="space-y-3">
          <div>
            <FieldLabel
              id="unique-vehicle-name-override"
              label="Name override"
              variant="dark"
            />
            <TextField
              id="unique-vehicle-name-override"
              type="text"
              variant="dark"
              value={nameOverride}
              onChange={(e) => setNameOverride(e.target.value)}
              placeholder="Leave blank to use template name"
              disabled={submitting || loadingEdit}
            />
          </div>
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
              label="Max HP override"
              value={maxHpOverride}
              onChange={setMaxHpOverride}
              disabled={submitting || loadingEdit}
              required={false}
              min={1}
              placeholder="Optional"
            />
            <ModalNumberField
              id="unique-vehicle-combat-speed-override"
              label="Combat speed override"
              value={combatSpeedMetresOverride}
              onChange={setCombatSpeedMetresOverride}
              disabled={submitting || loadingEdit}
              required={false}
              min={1}
              placeholder="Optional"
            />
            <ModalNumberField
              id="unique-vehicle-travel-speed-override"
              label="Travel speed override"
              value={travelSpeedKmhOverride}
              onChange={setTravelSpeedKmhOverride}
              disabled={submitting || loadingEdit}
              required={false}
              min={1}
              placeholder="Optional"
            />
            <ModalNumberField
              id="unique-vehicle-manoeuvrability-override"
              label="Manoeuvrability override"
              value={manoeuvrabilityOverride}
              onChange={setManoeuvrabilityOverride}
              disabled={submitting || loadingEdit}
              required={false}
              placeholder="Optional"
            />
            <ModalNumberField
              id="unique-vehicle-passengers-override"
              label="Max passengers override"
              value={maxPassengersOverride}
              onChange={setMaxPassengersOverride}
              disabled={submitting || loadingEdit}
              required={false}
              min={1}
              placeholder="Optional"
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
              label="Vehicle size override"
              variant="dark"
            />
            <SelectDropdown
              id="unique-vehicle-size-override"
              label="Vehicle size override"
              showLabel={false}
              placeholder="Leave unchanged"
              value={vehicleSizeCategoryOverride}
              options={[...sizeOptions]}
              disabled={submitting || loadingEdit}
              onChange={(value) =>
                setVehicleSizeCategoryOverride(value as VehicleSizeCategory)
              }
            />
            {vehicleSizeCategoryOverride ? (
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
        </div>
      </section>

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
