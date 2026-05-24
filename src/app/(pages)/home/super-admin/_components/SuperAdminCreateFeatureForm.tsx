"use client";

import type { PathName } from "@prisma/client";
import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { GeneralInformationRichTextField } from "@/app/components/character/GeneralInformationRichTextField";
import { featureCatalogueCreateSchema } from "@/app/lib/types/featureCatalogue";
import { serializeEditorToStoredHtml } from "@/app/lib/tiptap/generalInformationRichText";
import { NumberInput } from "@/app/components/shared/NumberInput";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import {
  parseCreatedCatalogueId,
  superAdminCatalogueCreatedHref,
} from "../_utils/superAdminCatalogueCreated";
import { superAdminRichEditorScrollClass } from "../_utils/superAdminRichTextEditor";
import { SuperAdminCatalogueDomainNav } from "./SuperAdminCatalogueDomainNav";
import { SuperAdminSectionShell } from "./SuperAdminSectionShell";
import { SuperAdminLabeledField } from "./superAdminFormPrimitives";
import { PATH_NAME_SELECT_OPTIONS } from "./pathNameSelectOptions";

type FeatureFormValues = {
  name: string;
  description: string;
  minPathRank: number;
  maxGrade: number;
  /** Single rich-text example; persisted as `examples: [html]` when non-empty. */
  examplesHtml: string;
};

function optionalRichHtml(html: string): string | undefined {
  const t = html.trim();
  if (!t) return undefined;
  const persisted = serializeEditorToStoredHtml(t);
  return persisted || undefined;
}

function examplesFromRichHtml(html: string): string[] {
  const persisted = optionalRichHtml(html);
  return persisted ? [persisted] : [];
}

export function SuperAdminCreateFeatureForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<PathName>>(
    () => new Set()
  );

  const pathValues = useMemo(
    () => PATH_NAME_SELECT_OPTIONS.map((o) => o.value as PathName),
    []
  );

  const form = useForm<FeatureFormValues>({
    defaultValues: {
      name: "",
      description: "",
      minPathRank: 1,
      maxGrade: 3,
      examplesHtml: "",
    },
  });

  const togglePath = (p: PathName, on: boolean) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (on) next.add(p);
      else next.delete(p);
      return next;
    });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setErrorMessage(null);
    const applicablePaths = [...selectedPaths];

    const descriptionStored = serializeEditorToStoredHtml(
      values.description.trim()
    );
    if (!descriptionStored) {
      setErrorMessage("Description is required.");
      return;
    }

    const payload = {
      name: values.name.trim(),
      description: descriptionStored,
      minPathRank: values.minPathRank,
      maxGrade: values.maxGrade,
      examples: examplesFromRichHtml(values.examplesHtml),
      applicablePaths,
    };

    const parsed = featureCatalogueCreateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues.map((i) => i.message).join(". "));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/features", {
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
          "Feature was created but the response did not include an id."
        );
        return;
      }
      router.push(superAdminCatalogueCreatedHref("feature", createdId));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SuperAdminSectionShell
      title="Create feature"
      description="Description and examples use TipTap (stored as HTML). Examples are saved as a single optional rich-text entry. Select paths that already exist in the catalogue; PathFeature links are synced automatically."
    >
      <SuperAdminCatalogueDomainNav domain="features" active="create" />

      <FormProvider {...form}>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-4">
          <SuperAdminLabeledField
            id="feature-name"
            label="Name"
            register={form.register}
            name="name"
          />

          <div className="mb-6">
            <label
              htmlFor="feature-description"
              className="mb-1 block font-bold text-black"
            >
              Description
            </label>
            <p className="mb-2 text-xs text-black/70">
              Rich text is stored as HTML (same editor as character backstory).
            </p>
            <Controller
              name="description"
              control={form.control}
              defaultValue=""
              render={({ field }) => (
                <GeneralInformationRichTextField
                  id="feature-description"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  minHeightClass="min-h-28"
                  editorContentClassName={superAdminRichEditorScrollClass}
                />
              )}
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="feature-examples"
              className="mb-1 block font-bold text-black"
            >
              Examples (optional)
            </label>
            <p className="mb-2 text-xs text-black/70">
              Optional worked example for GMs. Stored as one HTML entry in the
              examples array (same pattern as seed data).
            </p>
            <Controller
              name="examplesHtml"
              control={form.control}
              defaultValue=""
              render={({ field }) => (
                <GeneralInformationRichTextField
                  id="feature-examples"
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
              name="minPathRank"
              label="Min path rank"
              min={1}
              className="mb-0"
            />
            <NumberInput
              name="maxGrade"
              label="Max grade"
              min={1}
              max={6}
              className="mb-0"
            />
          </div>

          <fieldset className="mb-6">
            <legend className="mb-2 block font-bold text-black">
              Applicable paths
            </legend>
            <p className="mb-2 text-xs text-black/70">
              Each selected path must already have a row in the database.
            </p>
            <div className="flex flex-col gap-2">
              {pathValues.map((p) => (
                <Checkbox
                  key={p}
                  checked={selectedPaths.has(p)}
                  onChange={(on) => togglePath(p, on)}
                  label={p.replaceAll("_", " ")}
                />
              ))}
            </div>
          </fieldset>

          {errorMessage ? (
            <InfoCard className="border-neblirDanger bg-paleBlue/20">
              <p className="text-sm text-black">{errorMessage}</p>
            </InfoCard>
          ) : null}

          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? "Creating…" : "Create feature"}
          </Button>
        </form>
      </FormProvider>
    </SuperAdminSectionShell>
  );
}
