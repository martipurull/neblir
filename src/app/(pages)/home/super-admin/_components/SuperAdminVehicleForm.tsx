"use client";

import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { RichTextField } from "@/app/components/shared/RichTextField";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  parseCreatedCatalogueId,
  superAdminCatalogueCreatedHref,
} from "../_utils/superAdminCatalogueCreated";
import { superAdminRichEditorScrollClass } from "../_utils/superAdminRichTextEditor";
import { optionalStoredRichHtml } from "@/app/lib/tiptap/richText";
import type { Vehicle } from "@/app/lib/types/vehicle";
import {
  vehicleSchema,
  vehicleUpdateSchema,
  type VehicleAccessType,
  type VehicleLocomotion,
  type VehicleSizeCategory,
} from "@/app/lib/types/vehicle";
import { SuperAdminCatalogueDomainNav } from "./SuperAdminCatalogueDomainNav";
import { SuperAdminCatalogueImageBlock } from "./SuperAdminCatalogueImageBlock";
import { SuperAdminSectionShell } from "./SuperAdminSectionShell";
import { superAdminNavLinkClassName } from "./superAdminNavLinkClass";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";

type VehicleRow = Vehicle & { id: string; imageKey?: string | null };

type VehicleFormValues = {
  accessType: VehicleAccessType;
  name: string;
  brand: string;
  year: string;
  imageKey: string;
  confCost: string;
  costInfo: string;
  description: string;
  notes: string;
  maxHp: string;
  travelSpeedKmh: string;
  combatSpeedMetres: string;
  manoeuvrability: string;
  weight: string;
  heightMetres: string;
  maxCargoWeightKg: string;
  maxMountedItems: string;
  maxPassengers: string;
  vehicleSizeCategory: VehicleSizeCategory;
  locomotionModes: VehicleLocomotion[];
};

const accessOptions = [
  { value: "PLAYER", label: "Player" },
  { value: "GAME_MASTER", label: "Game master" },
];

const sizeOptions = [
  { value: "LIGHT", label: "Light" },
  { value: "STANDARD", label: "Standard" },
  { value: "HEAVY", label: "Heavy" },
];

const locomotionOptions: Array<{
  value: VehicleLocomotion;
  label: string;
}> = [
  { value: "LAND", label: "Land" },
  { value: "AIR", label: "Air" },
  { value: "SEA", label: "Sea" },
  { value: "SNOW", label: "Snow" },
];

function optionalTrimmedText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function optionalInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalFloat(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function requiredInt(value: string): number {
  return Number.parseInt(value.trim(), 10);
}

function vehicleToFormValues(vehicle: VehicleRow): VehicleFormValues {
  return {
    accessType: vehicle.accessType,
    name: vehicle.name,
    brand: vehicle.brand ?? "",
    year: vehicle.year != null ? String(vehicle.year) : "",
    imageKey: vehicle.imageKey ?? "",
    confCost: String(vehicle.confCost),
    costInfo: vehicle.costInfo ?? "",
    description: vehicle.description,
    notes: vehicle.notes ?? "",
    maxHp: String(vehicle.maxHp),
    travelSpeedKmh: String(vehicle.travelSpeedKmh),
    combatSpeedMetres: String(vehicle.combatSpeedMetres),
    manoeuvrability: String(vehicle.manoeuvrability),
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
  };
}

async function vehicleFetcher(url: string): Promise<VehicleRow> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as VehicleRow;
}

export function SuperAdminVehicleForm({
  editVehicleId,
}: {
  editVehicleId?: string;
} = {}) {
  const router = useRouter();
  const isEdit = Boolean(editVehicleId?.trim());
  const imageKeyRef = useRef("");
  const [status, setStatus] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data, error, isLoading } = useSWR<VehicleRow>(
    isEdit && editVehicleId ? `/api/vehicles/${editVehicleId}` : null,
    vehicleFetcher
  );

  const form = useForm<VehicleFormValues>({
    defaultValues: {
      accessType: "PLAYER",
      name: "",
      brand: "",
      year: "",
      imageKey: "",
      confCost: "0",
      costInfo: "",
      description: "",
      notes: "",
      maxHp: "1",
      travelSpeedKmh: "1",
      combatSpeedMetres: "1",
      manoeuvrability: "0",
      weight: "",
      heightMetres: "",
      maxCargoWeightKg: "",
      maxMountedItems: "",
      maxPassengers: "1",
      vehicleSizeCategory: "LIGHT",
      locomotionModes: ["LAND"],
    },
  });

  useEffect(() => {
    if (!data) return;
    const next = vehicleToFormValues(data);
    imageKeyRef.current = next.imageKey;
    form.reset(next);
  }, [data, form]);

  const watchedName = useWatch({ control: form.control, name: "name" });

  const onImageKey = useCallback(
    (key: string) => {
      imageKeyRef.current = key;
      form.setValue("imageKey", key, { shouldDirty: true });
    },
    [form]
  );

  const toggleLocomotion = (mode: VehicleLocomotion, checked: boolean) => {
    const current = new Set(form.getValues("locomotionModes"));
    if (checked) current.add(mode);
    else current.delete(mode);
    form.setValue("locomotionModes", [...current], { shouldValidate: true });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setStatus(null);
    setDeleteError(null);

    const description = optionalStoredRichHtml(values.description);
    if (!description) {
      setStatus("Description is required.");
      return;
    }

    const payload = {
      accessType: values.accessType,
      name: values.name.trim(),
      brand: optionalTrimmedText(values.brand),
      year: optionalInt(values.year),
      imageKey: optionalTrimmedText(imageKeyRef.current),
      confCost: requiredInt(values.confCost),
      costInfo: optionalTrimmedText(values.costInfo),
      description,
      notes: optionalTrimmedText(values.notes),
      maxHp: requiredInt(values.maxHp),
      travelSpeedKmh: requiredInt(values.travelSpeedKmh),
      combatSpeedMetres: requiredInt(values.combatSpeedMetres),
      manoeuvrability: requiredInt(values.manoeuvrability),
      weight: optionalFloat(values.weight),
      heightMetres: optionalFloat(values.heightMetres),
      maxCargoWeightKg: optionalFloat(values.maxCargoWeightKg),
      maxMountedItems: optionalInt(values.maxMountedItems),
      maxPassengers: requiredInt(values.maxPassengers),
      locomotionModes: values.locomotionModes,
      vehicleSizeCategory: values.vehicleSizeCategory,
    };

    const parsed = (isEdit ? vehicleUpdateSchema : vehicleSchema).safeParse(
      payload
    );
    if (!parsed.success) {
      setStatus(parsed.error.issues.map((i) => i.message).join(". "));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        isEdit ? `/api/vehicles/${editVehicleId}` : "/api/vehicles",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(
          typeof body?.message === "string"
            ? body.message
            : `Request failed (${res.status})`
        );
        return;
      }
      if (isEdit) {
        router.push("/home/super-admin/vehicles/browse");
        return;
      }
      const createdId = parseCreatedCatalogueId(body);
      if (!createdId) {
        setStatus(
          "Vehicle was created but the response did not include an id."
        );
        return;
      }
      router.push(superAdminCatalogueCreatedHref("vehicle", createdId));
    } finally {
      setSubmitting(false);
    }
  });

  const handleDelete = useCallback(async () => {
    if (!isEdit || !editVehicleId) return;
    if (!window.confirm("Delete this official vehicle from the catalogue?"))
      return;
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/vehicles/${editVehicleId}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(
          typeof body?.message === "string"
            ? body.message
            : `Delete failed (${res.status})`
        );
        return;
      }
      router.push("/home/super-admin/vehicles/browse");
    } finally {
      setDeleting(false);
    }
  }, [editVehicleId, isEdit, router]);

  const trimmedWatchedName =
    typeof watchedName === "string"
      ? watchedName.trim() === ""
        ? undefined
        : watchedName.trim()
      : undefined;
  const previewAlt = trimmedWatchedName ?? data?.name ?? "Vehicle";

  return (
    <SuperAdminSectionShell
      title={
        isEdit
          ? data
            ? `Edit vehicle: ${data.name}`
            : "Edit vehicle"
          : "Create official vehicle"
      }
      description={
        isEdit
          ? "Update the official vehicle catalogue entry."
          : "Create a global vehicle template for the official catalogue."
      }
    >
      <SuperAdminCatalogueDomainNav
        domain="vehicles"
        active={isEdit ? "browse" : "create"}
      />

      {isLoading ? (
        <InfoCard className="mb-6">
          <LoadingState text="Loading vehicle…" />
        </InfoCard>
      ) : null}

      {error ? (
        <InfoCard className="mb-6">
          <ErrorState
            message={error instanceof Error ? error.message : "Load failed"}
          />
        </InfoCard>
      ) : null}

      {!isEdit || data ? (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-4">
          <div className="mb-6">
            <SelectDropdown
              id="vehicle-access"
              label="Access"
              placeholder="Access"
              value={form.watch("accessType")}
              options={accessOptions}
              onChange={(value) =>
                form.setValue("accessType", value as VehicleAccessType, {
                  shouldValidate: true,
                })
              }
            />
          </div>

          <SuperAdminLabeledField
            id="vehicle-name"
            label="Name"
            register={form.register}
            name="name"
          />
          <SuperAdminLabeledField
            id="vehicle-brand"
            label="Brand (optional)"
            register={form.register}
            name="brand"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <SuperAdminLabeledField
              id="vehicle-year"
              label="Year (optional)"
              register={form.register}
              name="year"
              type="number"
            />
            <SuperAdminLabeledField
              id="vehicle-cost"
              label="Cost (CONF)"
              register={form.register}
              name="confCost"
              type="number"
            />
          </div>

          <SuperAdminLabeledField
            id="vehicle-cost-info"
            label="Cost info (optional)"
            register={form.register}
            name="costInfo"
          />

          <SuperAdminCatalogueImageBlock
            key={form.watch("imageKey") || "vehicle-image"}
            uploadType="vehicles"
            id="official-vehicle-image"
            label="Vehicle image (optional)"
            disabled={submitting || deleting}
            initialImageKey={form.watch("imageKey")}
            onImageKey={onImageKey}
            previewLayout="itemThumbnail"
            previewAlt={previewAlt}
          />

          <div className="mb-6">
            <label
              htmlFor="vehicle-description"
              className="mb-1 block font-bold text-black"
            >
              Description
            </label>
            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <RichTextField
                  id="vehicle-description"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  minHeightClass="min-h-24"
                  editorContentClassName={superAdminRichEditorScrollClass}
                />
              )}
            />
          </div>

          <SuperAdminLabeledField
            id="vehicle-notes"
            label="Notes (optional)"
            register={form.register}
            name="notes"
            rows={4}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <SuperAdminLabeledField
              id="vehicle-max-hp"
              label="Max HP"
              register={form.register}
              name="maxHp"
              type="number"
            />
            <SuperAdminLabeledField
              id="vehicle-manoeuvrability"
              label="Manoeuvrability"
              register={form.register}
              name="manoeuvrability"
              type="number"
            />
            <SuperAdminLabeledField
              id="vehicle-travel-speed"
              label="Travel speed (km/h)"
              register={form.register}
              name="travelSpeedKmh"
              type="number"
            />
            <SuperAdminLabeledField
              id="vehicle-combat-speed"
              label="Combat speed (metres)"
              register={form.register}
              name="combatSpeedMetres"
              type="number"
            />
            <SuperAdminLabeledField
              id="vehicle-max-passengers"
              label="Max passengers (incl. driver)"
              register={form.register}
              name="maxPassengers"
              type="number"
            />
            <SuperAdminLabeledField
              id="vehicle-max-mounted"
              label="Max mounted items (optional)"
              register={form.register}
              name="maxMountedItems"
              type="number"
            />
            <SuperAdminLabeledField
              id="vehicle-weight"
              label="Weight kg (optional)"
              register={form.register}
              name="weight"
              type="number"
              step="any"
            />
            <SuperAdminLabeledField
              id="vehicle-height"
              label="Height metres (optional)"
              register={form.register}
              name="heightMetres"
              type="number"
              step="any"
            />
            <SuperAdminLabeledField
              id="vehicle-cargo"
              label="Max cargo weight kg (optional)"
              register={form.register}
              name="maxCargoWeightKg"
              type="number"
              step="any"
            />
          </div>

          <div className="mb-6">
            <SelectDropdown
              id="vehicle-size"
              label="Vehicle size"
              placeholder="Vehicle size"
              value={form.watch("vehicleSizeCategory")}
              options={sizeOptions}
              onChange={(value) =>
                form.setValue(
                  "vehicleSizeCategory",
                  value as VehicleSizeCategory,
                  {
                    shouldValidate: true,
                  }
                )
              }
            />
          </div>

          <div className="mb-6">
            <p className="mb-2 block font-bold text-black">Locomotion modes</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {locomotionOptions.map((option) => (
                <Checkbox
                  key={option.value}
                  checked={form.watch("locomotionModes").includes(option.value)}
                  onChange={(checked) =>
                    toggleLocomotion(option.value, checked)
                  }
                  label={option.label}
                />
              ))}
            </div>
          </div>

          {status ? (
            <InfoCard className="border-neblirDanger bg-paleBlue/20">
              <p className="text-sm text-black">{status}</p>
            </InfoCard>
          ) : null}

          {deleteError ? (
            <InfoCard className="mt-4 border-neblirDanger bg-paleBlue/20">
              <p className="text-sm text-black">{deleteError}</p>
            </InfoCard>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || deleting}
            >
              {submitting
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save changes"
                  : "Create vehicle"}
            </Button>
            {isEdit ? (
              <Button
                type="button"
                variant="danger"
                disabled={submitting || deleting}
                onClick={() => {
                  void handleDelete();
                }}
              >
                {deleting ? "Deleting…" : "Delete vehicle"}
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}

      <Link
        href="/home/super-admin/vehicles/browse"
        className={`${superAdminNavLinkClassName} mt-6`}
      >
        ← Back to vehicles
      </Link>
    </SuperAdminSectionShell>
  );
}
