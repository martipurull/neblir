"use client";

import { GeneralInformationRichTextField } from "@/app/components/character/GeneralInformationRichTextField";
import { Button } from "@/app/components/shared/Button";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { mapUpdateSchema } from "@/app/lib/types/map";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import useSWR from "swr";
import {
  optionalSuperAdminRichHtml,
  superAdminRichEditorScrollClass,
} from "../_utils/superAdminRichTextEditor";
import { SuperAdminCatalogueImageBlock } from "./SuperAdminCatalogueImageBlock";
import { SuperAdminCatalogueDomainNav } from "./SuperAdminCatalogueDomainNav";
import { SuperAdminSectionShell } from "./SuperAdminSectionShell";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";
import { superAdminNavLinkClassName } from "./superAdminNavLinkClass";

type MapRow = {
  id: string;
  name: string;
  imageKey: string;
  description?: string | null;
};

type MapFormValues = {
  name: string;
  imageKey: string;
  description: string;
};

async function mapFetcher(url: string): Promise<MapRow> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return (await res.json()) as MapRow;
}

export function SuperAdminEditMapForm({ mapId }: { mapId: string }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<MapRow>(
    mapId ? `/api/maps/${mapId}` : null,
    mapFetcher
  );

  const form = useForm<MapFormValues>({
    defaultValues: { name: "", imageKey: "", description: "" },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({
      name: data.name,
      imageKey: data.imageKey,
      description: data.description ?? "",
    });
  }, [data, form]);

  const onImageKey = useCallback(
    (key: string) => {
      form.setValue("imageKey", key, { shouldDirty: true });
    },
    [form]
  );

  const watchedName = useWatch({ control: form.control, name: "name" });
  const mapPreviewAlt =
    (typeof watchedName === "string" && watchedName.trim()) ||
    data?.name ||
    "Map";

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    const imageKey = values.imageKey.trim();
    if (!imageKey) {
      setErrorMessage("Image is required.");
      return;
    }

    const payload = {
      name: values.name.trim(),
      imageKey,
      description: optionalSuperAdminRichHtml(values.description) ?? null,
    };
    const parsed = mapUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues.map((i) => i.message).join(". "));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/maps/${mapId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(
          typeof body?.message === "string"
            ? body.message
            : `Request failed (${res.status})`
        );
        return;
      }
      router.push("/home/super-admin/maps/browse");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SuperAdminSectionShell
      title={data ? `Edit map: ${data.name}` : "Edit map"}
      description="Update the map name, image, or description."
    >
      <SuperAdminCatalogueDomainNav domain="maps" active="browse" />

      {isLoading ? (
        <InfoCard className="mb-6">
          <LoadingState text="Loading map…" />
        </InfoCard>
      ) : null}

      {error ? (
        <InfoCard className="mb-6">
          <ErrorState
            message={error instanceof Error ? error.message : "Load failed"}
            onRetry={() => void mutate()}
            retryLabel="Retry"
          />
        </InfoCard>
      ) : null}

      {data ? (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-4">
          <SuperAdminLabeledField
            id="map-name"
            label="Name"
            register={form.register}
            name="name"
          />

          <SuperAdminCatalogueImageBlock
            key={data.imageKey}
            uploadType="maps"
            id="map-image"
            label="Image"
            disabled={submitting}
            initialImageKey={data.imageKey}
            onImageKey={onImageKey}
            previewVariant="map"
            previewAlt={mapPreviewAlt}
          />

          <div className="mb-6">
            <label
              htmlFor="map-description"
              className="mb-1 block font-bold text-black"
            >
              Description (optional)
            </label>
            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <GeneralInformationRichTextField
                  id="map-description"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  minHeightClass="min-h-24"
                  editorContentClassName={superAdminRichEditorScrollClass}
                />
              )}
            />
          </div>

          {errorMessage ? (
            <InfoCard className="border-neblirDanger bg-paleBlue/20">
              <p className="text-sm text-black">{errorMessage}</p>
            </InfoCard>
          ) : null}

          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </form>
      ) : null}

      <Link
        href="/home/super-admin/maps/browse"
        className={`${superAdminNavLinkClassName} mt-6`}
      >
        ← Back to maps
      </Link>
    </SuperAdminSectionShell>
  );
}
