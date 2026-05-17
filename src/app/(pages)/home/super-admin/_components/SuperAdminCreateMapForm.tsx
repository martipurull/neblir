"use client";

import Button from "@/app/components/shared/Button";
import InfoCard from "@/app/components/shared/InfoCard";
import { mapCreateSchema } from "@/app/lib/types/map";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  parseCreatedCatalogueId,
  superAdminCatalogueCreatedHref,
} from "../_utils/superAdminCatalogueCreated";
import SuperAdminSectionShell from "./SuperAdminSectionShell";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";

type MapFormValues = {
  name: string;
  imageKey: string;
  description: string;
};

export default function SuperAdminCreateMapForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<MapFormValues>({
    defaultValues: { name: "", imageKey: "", description: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    const payload = {
      name: values.name.trim(),
      imageKey: values.imageKey.trim(),
      description: values.description.trim() || null,
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
      description="Global maps omit gameId. Use an existing R2 image key (same as other map uploads)."
    >
      <form onSubmit={(e) => void onSubmit(e)} className="mt-4">
        <SuperAdminLabeledField
          id="map-name"
          label="Name (unique)"
          register={form.register}
          name="name"
        />
        <SuperAdminLabeledField
          id="map-image-key"
          label="Image key"
          register={form.register}
          name="imageKey"
          placeholder="maps/…"
        />
        <SuperAdminLabeledField
          id="map-description"
          label="Description (optional)"
          register={form.register}
          name="description"
          rows={3}
        />

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
