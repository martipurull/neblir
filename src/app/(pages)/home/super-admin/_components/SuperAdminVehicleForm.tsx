"use client";

import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { NumberInput } from "@/app/components/shared/NumberInput";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import { RichTextField } from "@/app/components/shared/RichTextField";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import useSWR from "swr";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
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
import {
  VEHICLE_ACCELERATION_LABEL,
  VEHICLE_COMBAT_SPEED_HELP,
  VEHICLE_COMBAT_SPEED_LABEL,
  VEHICLE_MANOEUVRABILITY_LABEL,
  VEHICLE_TRAVEL_SPEED_HELP,
  VEHICLE_TRAVEL_SPEED_LABEL,
} from "@/app/lib/constants/vehicleFields";
import { SuperAdminCatalogueDomainNav } from "./SuperAdminCatalogueDomainNav";
import { SuperAdminCatalogueImageBlock } from "./SuperAdminCatalogueImageBlock";
import { SuperAdminOfficialDeleteSection } from "./SuperAdminOfficialDeleteSection";
import { SuperAdminSectionShell } from "./SuperAdminSectionShell";
import { superAdminNavLinkClassName } from "./superAdminNavLinkClass";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";

type VehicleRow = Vehicle & { id: string; imageKey?: string | null };

type VehicleFormValues = {
  accessType: VehicleAccessType;
  name: string;
  brand: string;
  year: number | undefined;
  imageKey: string;
  confCost: number;
  costInfo: string;
  description: string;
  notes: string;
  maxHp: number;
  travelSpeedKmh: number;
  combatSpeedMetres: number;
  manoeuvrability: number;
  acceleration: number;
  weight: number | undefined;
  heightMetres: number | undefined;
  maxCargoWeightKg: number | undefined;
  maxMountedItems: number | undefined;
  maxPassengers: number;
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

function vehicleToFormValues(vehicle: VehicleRow): VehicleFormValues {
  return {
    accessType: vehicle.accessType,
    name: vehicle.name,
    brand: vehicle.brand ?? "",
    year: vehicle.year ?? undefined,
    imageKey: vehicle.imageKey ?? "",
    confCost: vehicle.confCost,
    costInfo: vehicle.costInfo ?? "",
    description: vehicle.description,
    notes: vehicle.notes ?? "",
    maxHp: vehicle.maxHp,
    travelSpeedKmh: vehicle.travelSpeedKmh,
    combatSpeedMetres: vehicle.combatSpeedMetres,
    manoeuvrability: vehicle.manoeuvrability,
    acceleration: vehicle.acceleration,
    weight: vehicle.weight ?? undefined,
    heightMetres: vehicle.heightMetres ?? undefined,
    maxCargoWeightKg: vehicle.maxCargoWeightKg ?? undefined,
    maxMountedItems: vehicle.maxMountedItems ?? undefined,
    maxPassengers: vehicle.maxPassengers,
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
  const isEdit = Boolean(editVehicleId?.trim());
  const { data, error, isLoading } = useSWR<VehicleRow>(
    isEdit && editVehicleId ? `/api/vehicles/${editVehicleId}` : null,
    vehicleFetcher
  );

  if (isEdit && isLoading) {
    return (
      <SuperAdminSectionShell
        title="Edit vehicle"
        description="Update the official vehicle catalogue entry."
      >
        <SuperAdminCatalogueDomainNav domain="vehicles" active="browse" />
        <InfoCard className="mb-6">
          <LoadingState text="Loading vehicle…" />
        </InfoCard>
      </SuperAdminSectionShell>
    );
  }

  return (
    <SuperAdminVehicleFormFields
      key={data?.id ?? "create"}
      editVehicleId={editVehicleId}
      data={data ?? null}
      loadError={error}
    />
  );
}

function SuperAdminVehicleFormFields({
  editVehicleId,
  data,
  loadError: error,
}: {
  editVehicleId?: string;
  data: VehicleRow | null;
  loadError: unknown;
}) {
  const router = useRouter();
  const isEdit = Boolean(editVehicleId?.trim());
  const initialValues = data
    ? vehicleToFormValues(data)
    : {
        accessType: "PLAYER" as const,
        name: "",
        brand: "",
        year: undefined,
        imageKey: "",
        confCost: 0,
        costInfo: "",
        description: "",
        notes: "",
        maxHp: 1,
        travelSpeedKmh: 1,
        combatSpeedMetres: 1,
        manoeuvrability: 0,
        acceleration: 1,
        weight: undefined,
        heightMetres: undefined,
        maxCargoWeightKg: undefined,
        maxMountedItems: undefined,
        maxPassengers: 1,
        vehicleSizeCategory: "LIGHT" as const,
        locomotionModes: ["LAND"] as VehicleLocomotion[],
      };
  const imageKeyRef = useRef(initialValues.imageKey);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<VehicleFormValues>({
    defaultValues: initialValues,
  });

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

    const description = optionalStoredRichHtml(values.description);
    if (!description) {
      setStatus("Description is required.");
      return;
    }

    const payload = {
      accessType: values.accessType,
      name: values.name.trim(),
      brand: optionalTrimmedText(values.brand),
      year: values.year,
      imageKey: optionalTrimmedText(imageKeyRef.current),
      confCost: values.confCost,
      costInfo: optionalTrimmedText(values.costInfo),
      description,
      notes: optionalTrimmedText(values.notes),
      maxHp: values.maxHp,
      travelSpeedKmh: values.travelSpeedKmh,
      combatSpeedMetres: values.combatSpeedMetres,
      manoeuvrability: values.manoeuvrability,
      acceleration: values.acceleration,
      weight: values.weight,
      heightMetres: values.heightMetres,
      maxCargoWeightKg: values.maxCargoWeightKg,
      maxMountedItems: values.maxMountedItems,
      maxPassengers: values.maxPassengers,
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

      {error ? (
        <InfoCard className="mb-6">
          <ErrorState
            message={error instanceof Error ? error.message : "Load failed"}
          />
        </InfoCard>
      ) : null}

      {!isEdit || data ? (
        <FormProvider {...form}>
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

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <NumberInput
                name="year"
                label="Year (optional)"
                allowEmpty
                className="mb-0"
              />
              <NumberInput
                name="confCost"
                label="Cost (CONF)"
                className="mb-0"
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
              disabled={submitting}
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

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <NumberInput name="maxHp" label="Max HP" className="mb-0" />
              <NumberInput
                name="manoeuvrability"
                label={VEHICLE_MANOEUVRABILITY_LABEL}
                className="mb-0"
              />
              <NumberInput
                name="acceleration"
                label={VEHICLE_ACCELERATION_LABEL}
                className="mb-0"
              />
              <div>
                <NumberInput
                  name="travelSpeedKmh"
                  label={VEHICLE_TRAVEL_SPEED_LABEL}
                  className="mb-0"
                />
                <p className="mt-1 text-xs text-black/65">
                  {VEHICLE_TRAVEL_SPEED_HELP}
                </p>
              </div>
              <div>
                <NumberInput
                  name="combatSpeedMetres"
                  label={VEHICLE_COMBAT_SPEED_LABEL}
                  className="mb-0"
                />
                <p className="mt-1 text-xs text-black/65">
                  {VEHICLE_COMBAT_SPEED_HELP}
                </p>
              </div>
              <NumberInput
                name="maxPassengers"
                label="Max passengers (incl. driver)"
                className="mb-0"
              />
              <NumberInput
                name="maxMountedItems"
                label="Max mounted items (optional)"
                allowEmpty
                className="mb-0"
              />
              <NumberInput
                name="weight"
                label="Weight kg (optional)"
                parseAs="float"
                step="any"
                allowEmpty
                preserveStepperFraction
                className="mb-0"
              />
              <NumberInput
                name="heightMetres"
                label="Height metres (optional)"
                parseAs="float"
                step="any"
                allowEmpty
                preserveStepperFraction
                className="mb-0"
              />
              <NumberInput
                name="maxCargoWeightKg"
                label="Max cargo weight kg (optional)"
                parseAs="float"
                step="any"
                allowEmpty
                preserveStepperFraction
                className="mb-0"
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
              <p className="mb-2 block font-bold text-black">
                Locomotion modes
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {locomotionOptions.map((option) => (
                  <Checkbox
                    key={option.value}
                    checked={form
                      .watch("locomotionModes")
                      .includes(option.value)}
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

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting
                  ? isEdit
                    ? "Saving…"
                    : "Creating…"
                  : isEdit
                    ? "Save changes"
                    : "Create vehicle"}
              </Button>
              {isEdit && editVehicleId && data ? (
                <SuperAdminOfficialDeleteSection
                  catalogueDomain="vehicles"
                  rowId={editVehicleId}
                  rowName={data.name}
                  deleteUrl={`/api/vehicles/${editVehicleId}`}
                  successHref="/home/super-admin/vehicles/browse"
                  entityLabel="vehicle"
                  disabled={submitting}
                />
              ) : null}
            </div>
          </form>
        </FormProvider>
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
