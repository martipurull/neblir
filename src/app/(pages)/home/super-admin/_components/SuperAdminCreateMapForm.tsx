"use client";

import { RichTextField } from "@/app/components/shared/RichTextField";
import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { mapCreateSchema } from "@/app/lib/types/map";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { optionalStoredRichHtml } from "@/app/lib/tiptap/richText";
import { superAdminRichEditorScrollClass } from "../_utils/superAdminRichTextEditor";
import {
  parseCreatedCatalogueId,
  superAdminCatalogueCreatedHref,
} from "../_utils/superAdminCatalogueCreated";
import { SuperAdminCatalogueImageBlock } from "./SuperAdminCatalogueImageBlock";
import { SuperAdminCatalogueDomainNav } from "./SuperAdminCatalogueDomainNav";
import { SuperAdminSectionShell } from "./SuperAdminSectionShell";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";

type MapFormValues = {
  name: string;
  imageKey: string;
  description: string;
};

export function SuperAdminCreateMapForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<MapFormValues>({
    defaultValues: { name: "", imageKey: "", description: "" },
  });

  const onImageKey = useCallback(
    (key: string) => {
      form.setValue("imageKey", key, { shouldDirty: true });
    },
    [form]
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);

    const imageKey = values.imageKey.trim();
    if (!imageKey) {
      setErrorMessage("Image is required. Upload a map image before creating.");
      return;
    }

    const payload = {
      name: values.name.trim(),
      imageKey,
      description: optionalStoredRichHtml(values.description) ?? null,
    };
    const parsed = mapCreateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues.map((i) => i.message).join(". "));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/maps", {
        method: "POST",
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
      const createdId = parseCreatedCatalogueId(body);
      if (!createdId) {
        setErrorMessage(
          "Map was created but the response did not include an id."
        );
        return;
      }
      router.push(superAdminCatalogueCreatedHref("map", createdId));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SuperAdminSectionShell
      title="Create global map"
      description="Global maps omit gameId. Upload the map image and optionally add a rich-text description."
    >
      <SuperAdminCatalogueDomainNav domain="maps" active="create" />

      <form onSubmit={(e) => void onSubmit(e)} className="mt-4">
        <SuperAdminLabeledField
          id="map-name"
          label="Name (unique)"
          register={form.register}
          name="name"
        />

        <SuperAdminCatalogueImageBlock
          uploadType="maps"
          id="map-image"
          label="Image"
          disabled={submitting}
          onImageKey={onImageKey}
          previewLayout="cover"
        />

        <div className="mb-6">
          <label
            htmlFor="map-description"
            className="mb-1 block font-bold text-black"
          >
            Description (optional)
          </label>
          <p className="mb-2 text-xs text-black/70">
            Rich text is stored as HTML (same editor as character backstory).
          </p>
          <Controller
            name="description"
            control={form.control}
            render={({ field }) => (
              <RichTextField
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
          {submitting ? "Creating…" : "Create map"}
        </Button>
      </form>
    </SuperAdminSectionShell>
  );
}
