"use client";

import { GeneralInformationRichTextField } from "@/app/components/character/GeneralInformationRichTextField";
import { Button } from "@/app/components/shared/Button";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { NumberInput } from "@/app/components/shared/NumberInput";
import { enemyCreateSchema } from "@/app/lib/types/enemy";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import {
  optionalSuperAdminRichHtml,
  superAdminRichEditorScrollClass,
} from "../_utils/superAdminRichTextEditor";
import {
  parseCreatedCatalogueId,
  superAdminCatalogueCreatedHref,
} from "../_utils/superAdminCatalogueCreated";
import { SuperAdminCatalogueImageBlock } from "./SuperAdminCatalogueImageBlock";
import SuperAdminCatalogueDomainNav from "./SuperAdminCatalogueDomainNav";
import SuperAdminSectionShell from "./SuperAdminSectionShell";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";

type EnemyFormValues = {
  name: string;
  description: string;
  imageKey: string;
  health: number;
  speed: number;
  initiativeModifier: number;
  numberOfReactions: number;
  notes: string;
};

export default function SuperAdminCreateEnemyForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<EnemyFormValues>({
    defaultValues: {
      name: "",
      description: "",
      imageKey: "",
      health: 10,
      speed: 5,
      initiativeModifier: 0,
      numberOfReactions: 1,
      notes: "",
    },
  });

  const onImageKey = useCallback(
    (key: string) => {
      form.setValue("imageKey", key, { shouldDirty: true });
    },
    [form]
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    const payload = {
      name: values.name.trim(),
      description: optionalSuperAdminRichHtml(values.description),
      imageKey: values.imageKey.trim() || undefined,
      health: values.health,
      speed: values.speed,
      initiativeModifier: values.initiativeModifier,
      numberOfReactions: values.numberOfReactions,
      immunities: [] as const,
      resistances: [] as const,
      vulnerabilities: [] as const,
      actions: [],
      additionalActions: [],
      notes: optionalSuperAdminRichHtml(values.notes),
    };

    const parsed = enemyCreateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues.map((i) => i.message).join(". "));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/enemies", {
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
          "Enemy was created but the response did not include an id."
        );
        return;
      }
      router.push(superAdminCatalogueCreatedHref("enemy", createdId));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SuperAdminSectionShell
      title="Create enemy"
      description="Official enemy template. Description and notes use TipTap (stored as HTML). Defence and attack stats use schema defaults (0) unless you add them later via PATCH or the DB."
    >
      <SuperAdminCatalogueDomainNav domain="enemies" active="create" />

      <FormProvider {...form}>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-4">
          <SuperAdminLabeledField
            id="enemy-name"
            label="Name"
            register={form.register}
            name="name"
          />

          <SuperAdminCatalogueImageBlock
            uploadType="custom_enemies"
            id="enemy-image"
            label="Image"
            disabled={submitting}
            onImageKey={onImageKey}
          />

          <div className="mb-6">
            <label
              htmlFor="enemy-description"
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
                <GeneralInformationRichTextField
                  id="enemy-description"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  minHeightClass="min-h-24"
                  editorContentClassName={superAdminRichEditorScrollClass}
                />
              )}
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 [&>div]:mb-0">
            <NumberInput
              name="health"
              label="Health"
              min={0}
              className="mb-0"
            />
            <NumberInput name="speed" label="Speed" min={0} className="mb-0" />
            <NumberInput
              name="initiativeModifier"
              label="Initiative modifier"
              className="mb-0"
            />
            <NumberInput
              name="numberOfReactions"
              label="Number of reactions"
              min={0}
              className="mb-0"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="enemy-notes"
              className="mb-1 block font-bold text-black"
            >
              Notes (optional)
            </label>
            <p className="mb-2 text-xs text-black/70">
              GM-facing notes; stored as HTML when non-empty.
            </p>
            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <GeneralInformationRichTextField
                  id="enemy-notes"
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
            {submitting ? "Creating…" : "Create enemy"}
          </Button>
        </form>
      </FormProvider>
    </SuperAdminSectionShell>
  );
}
